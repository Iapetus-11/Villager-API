from mcstatus import MinecraftServer
from time import perf_counter
import dns.asyncresolver
from aiohttp import web
import asyncio_dgram
import asyncio
import struct

# default / offline server
DEFAULT = {
    'online': False,  # boolean
    'players_online': 0,  # int
    'players_max': 0,  # int
    'players_names': [],  # List['player', 'player']
    'latency': 0,  # float milliseconds
    'version': {'brand': None, 'software': None, 'protocol': None},  # dict
    'motd': None,  # string
    'favicon': None,  # string / dataurl
    #'plugins': [],  # List['plugin', 'plugin']
    'map': None,  # string
    'gamemode': None  # string
}

ABCD = 'ABCDefghijklmnopqrstuvwxyz'
TIMEOUT = 2

async def ping_status(host, port):  # all je servers should support this
    if port is None:
        port = 25565

    try:
        status = await MinecraftServer(host, port).async_status(tries=1)
    except BaseException:
        return DEFAULT

    s_dict = DEFAULT.copy()

    s_dict['online'] = True
    s_dict['players_online'] = status.players.online
    s_dict['players_max'] = status.players.max
    s_dict['players_names'] = None if status.players.sample is None else [p.name for p in status.players.sample]
    s_dict['latency'] = round(status.latency, 2)
    s_dict['version'] = {
        'brand': 'Java Edition',
        'software': status.version.name,
        'protocol': f'ping {status.version.protocol}',
        'method': 'ping'
    }
    s_dict['motd'] = status.description
    s_dict['favicon'] = status.favicon

    return s_dict

async def raknet_status(host, port): # Should work on all BE servers
    if port is None:
        port = 19132

    start = perf_counter()

    try:
        stream = await asyncio.wait_for(asyncio_dgram.connect((host, port)), TIMEOUT)

        #data = b'\x01' + struct.pack('>q', 0) + bytearray.fromhex('00 ff ff 00 fe fe fe fe fd fd fd fd 12 34 56 78')
        await asyncio.wait_for(
            stream.send(b'\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff\x00\xfe\xfe\xfe\xfe\xfd\xfd\xfd\xfd\x124Vx'),
            TIMEOUT
        )

        data, _ = await asyncio.wait_for(stream.recv(), TIMEOUT)
    except BaseException:
        return DEFAULT
    finally:
        try:
            stream.close()
        except BaseException:
            pass

    latency = round((perf_counter() - start) * 1000, 2)

    data = data[1:]
    name_length = struct.unpack('>H', data[32:34])[0]
    data = data[34:34+name_length].decode().split(';')

    s_dict = DEFAULT.copy()

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
    print(host, ':', port)

    if do_resolve and host.strip(ABCD + '1234567890.') == '':
        try:
            d_ans = await asyncio.wait_for(dns.asyncresolver.resolve(f'_minecraft._tcp.{host}', 'SRV', search=True, tcp=True), 1)
            return await mcstatus(d_ans[0].target.to_text().strip('.'), d_ans[0].port)
        except BaseException:
            pass

    statuses = (ping_status(host, port), raknet_status(host, port),)

    try:
        for status in asyncio.as_completed(statuses, timeout=TIMEOUT):
            status = await status

            if status['online']:
                return status
    except BaseException:
        return DEFAULT

    return status

def cleanup(server):
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
    if '..' in mcserver:
        return False

    if mcserver.strip(ABCD + '1234567890./:') != '':
        print('invalid', mcserver, mcserver.strip(ABCD + '1234567890./:'))
        return False

    if len(mcserver) < 4:
        return False

    s = mcserver.split(':')

    if len(s) > 1:
        try:
            p = int(s[1])
            if p < 0 > 65535:
                print('invalid due to port range')
                return False
        except BaseException:
            return False

    return True

async def handler(r):
    if r.remote not in ('::1', 'localhost', '127.0.0.1'):
        return web.Response(status=401)  # 401 unauthed

    jj = await r.json()

    mcserver = jj.get('mcserver')
    if mcserver is None:
        return web.Response(status=400)  # 400 bad request

    if not validate(mcserver):
        return web.json_response(DEFAULT)

    status = await mcstatus(*cleanup(mcserver), True)
    return web.json_response(status)

web_app = web.Application()
web_app.router.add_view('/mcstatus', handler)

loop = asyncio.get_event_loop()
web.run_app(web_app, host='localhost', port=2304)  # this is blocking
