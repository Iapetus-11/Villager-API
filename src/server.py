from mcstatus import MinecraftServer
from time import perf_counter
import dns.asyncresolver
from aiohttp import web
import asyncio_dgram
import asyncio
import struct
import psutil

# default / offline server
default = {
    'online': False, # boolean
    'players_online': 0, # int
    'players_max': 0, # int
    'players_names': [], # List['player', 'player']
    'latency': 0, # float milliseconds
    'version': {'brand': None, 'software': None, 'protocol': None}, # dict
    'motd': None, # string
    'favicon': None, # string / dataurl
    #'plugins': [], # List['plugin', 'plugin']
    'map': None,
    'gamemode': None # string
}

abcd = 'abcdefghijklmnopqrstuvwxyz'

async def ping_status(host, port):  # all je servers support this
    print('ping pong')

    if port is None:
        port = 25565

    try:
        status = await MinecraftServer(host, port).async_status(tries=1)
    except BaseException:
        return default

    s_dict = default.copy()

    s_dict['online'] = True
    s_dict['players_online'] = status.players.online
    s_dict['players_max'] = status.players.max
    s_dict['players_names'] = None if status.players.sample is None else [p.name for p in status.players.sample]
    s_dict['latency'] = round(status.latency, 2)
    s_dict['version'] = {
        'brand': 'Java Edition',
        'software': status.version.name, # string
        'protocol': f'ping {status.version.protocol}', #string
        'method': 'ping'
    }
    s_dict['motd'] = status.description
    s_dict['favicon'] = status.favicon

    return s_dict

async def raknet_status(host, port): # Should work on all BE servers
    print('raknet')
    if port is None:
        port = 19132

    start = perf_counter()

    try:
        stream = await asyncio_dgram.connect((host, port))

        #data = b'\x01' + struct.pack('>q', 0) + bytearray.fromhex('00 ff ff 00 fe fe fe fe fd fd fd fd 12 34 56 78')
        await stream.send(b'\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff\x00\xfe\xfe\xfe\xfe\xfd\xfd\xfd\xfd\x124Vx')
        data, _ = await stream.recv()

        stream.close()
    except BaseException:
        return default

    latency = round((perf_counter() - start), 2)

    data = data[1:]
    name_length = struct.unpack('>H', data[32:34])[0]
    data = data[34:34+name_length].decode().split(';')

    s_dict = default.copy()

    s_dict['online'] = True
    s_dict['players_online'] = int(data[4])
    s_dict['players_max'] = int(data[5])
    s_dict['latency'] = latency
    s_dict['version'] = {
        'brand': data[0], # string
        'software': None, # string, assumes server is vanilla bc pocketmine + nukkit use query
        'protocol': f'raknet {data[2]}',
        'method': 'raknet'
    }
    s_dict['motd'] = data[1]

    try:
        s_dict['map'] = data[7]
        s_dict['gamemode'] = data[8]
    except IndexError:
        pass

    return s_dict

async def mcstatus(host, port, do_resolve=False):
    print('unified')
    if do_resolve:
        for c in host:
            if c in abcd:
                try:
                    d_ans = await asyncio.wait_for(dns.asyncresolver.resolve(f'_minecraft._tcp.{host}', 'SRV', search=True, tcp=True), 1)
                    return await mcstatus(d_ans[0].target.to_text().strip('.'), d_ans[0].port)
                except BaseException:
                    pass

                break

    proc = psutil.Process()
    print(proc.open_files())

    statuses = (ping_status(host, port), raknet_status(host, port),)

    try:
        for status in asyncio.as_completed(statuses, timeout=2):
            print(proc.open_files())
            status = await status

            if status['online']:
                return status
    except BaseException:
        return default

    return status

def cleanup(server):
    print('cleanup')
    if ':' in server:
        split = server.split(':')
        host = split[0]

        try:
            port = int(split[1])
        except BaseException:
            port = None
    else:
        host = server
        port = None

    return host, port

def validate(mcserver):
    print('validate')
    if '..' in mcserver: return False

    for char in mcserver:
        if char not in (abcd + '1234567890./:'):
            return False

    if len(mcserver) < 4: return False

    s = mcserver.split(':')
    if len(s) > 1:
        try:
            p = int(s[1])
            if p < 0 > 65535:
                return False
        except BaseException:
            return False

    return True

async def handler(r):
    print('handler')
    if r.remote not in ('::1', 'localhost', '127.0.0.1'):
        return web.Response(status=401)  # 401 unauthed

    jj = await r.json()

    mcserver = jj.get('mcserver')
    if mcserver is None:
        return web.Response(status=400) # 400 bad request

    if not validate(mcserver):
        return web.json_response(default)

    status = await mcstatus(*cleanup(mcserver), True)
    return web.json_response(status)

web_app = web.Application()
web_app.router.add_view('/mcstatus', handler)

loop = asyncio.get_event_loop()
web.run_app(web_app, host='localhost', port=2304) # this is blocking
