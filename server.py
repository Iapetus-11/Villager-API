from aiohttp import web
import asyncio
import concurrent.futures
from functools import partial
import socket
from mcstatus import MinecraftServer as mcstatus
from pyraklib.protocol.UNCONNECTED_PING import UNCONNECTED_PING
from pyraklib.protocol.UNCONNECTED_PONG import UNCONNECTED_PONG
from time import sleep, time
import json

with open('private.json', 'r') as private:
    allowed_ips = json.load(private)['allowed_ips']

# default / offline server
default = {
    'online': False, # boolean
    'map': None, # string
    'players_online': 0, # int
    'players_max': 0, # int
    'players_names': [], # List['player', 'player']
    'latency': 0, # float milliseconds
    'version': {'brand': None, 'software': None, 'protocol': None}, # dict
    'motd': None, # string
    'favicon': None, # string / dataurl
    'plugins': [], # List['plugin', 'plugin']
    'gamemode': None # string
}

async def cleanup_args(server_str, _port=None):  # cleanup arguments given in the request
    if ':' in server_str and _port is None:
        split = server_str.split(':')
        ip = split[0]
        try:
            port = int(split[1])
        except ValueError:
            return default
    else:
        ip = server_str
        port = _port

    if port is None:
        str_port = ''
        if ':' not in server_str:
            str_port = ':25565'

    return ip, port, str_port

def ping_status(combined_server):  # all je servers support this
    try:
        status = mcstatus.lookup(combined_server).status()
    except Exception:
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

def query_status(combined_server):  # some je and most pocketmine servers support this
    time_before = time()

    try:
        query = mcstatus.lookup(combined_server).query()
    except Exception:
        return default

    latency = round((time() - time_before) * 1000, 2)

    s_dict = default.copy()

    s_dict['online'] = True
    s_dict['players_online'] = query.players.online
    s_dict['players_max'] = query.players.max
    s_dict['players_names'] = query.players.names
    s_dict['latency'] = latency
    s_dict['version'] = {
        'brand': None,
        'software': query.software.version, # string
        'protocol': 'query',
        'method': 'query'
    }
    s_dict['motd'] = query.motd
    s_dict['map'] = query.map
    s_dict['plugins'] = query.software.plugins

    return s_dict

def raknet_status(ip, port):  # basically create a mini/shitty raknet client to check the status of BE servers
    if port is None:
        port = 19132

    ping = UNCONNECTED_PING()
    ping.pingID = 4201
    ping.encode()

    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    #s.setblocking(0) # non blocking
    s.settimeout(2) # 2 seconds

    time_before = time()
    try:
        s.sendto(ping.buffer, (socket.gethostbyname(ip), port))
        recv_data = s.recvfrom(2048)
    except BlockingIOError:
        return default
    except socket.gaierror:
        return default
    except socket.timeout:
        return default

    pong = UNCONNECTED_PONG()
    pong.buffer = recv_data[0]
    pong.decode()

    latency = round((time() - time_before) * 1000, 2)

    data = pong.serverName.decode('UTF-8').split(';')
    # str(pong.serverName) => https://wiki.vg/Raknet_Protocol#Unconnected_Ping
    # b'MCPE;Nether updateeeeeee!;407;1.16.1;1;20;12172066879061040769;Xenon BE 6.0;Survival;1;19132;19133;'

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

async def cleanup_args(server_str, _port=None):
    if ':' in server_str and _port is None:
        split = server_str.split(':')
        ip = split[0]
        try:
            port = int(split[1])
        except ValueError:
            port = None
    else:
        ip = server_str
        port = _port

    if port is None:
        str_port = ''
    else:
        str_port = f':{port}'

    return ip, port, str_port

async def unified_mcping(server_str, _port=None, _ver=None):
    ip, port, str_port = await cleanup_args(server_str, _port) # cleanup input

    if _ver == 'status':
        ping_status_partial = partial(ping_status, f'{ip}{str_port}')
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await loop.run_in_executor(pool, ping_status_partial)
    elif _ver == 'query':
        query_status_partial = partial(query_status, f'{ip}{str_port}')
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await loop.run_in_executor(pool, query_status_partial)
    elif _ver == 'raknet':
        raknet_status_partial = partial(raknet_status, ip, port)
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return await loop.run_in_executor(pool, raknet_status_partial)
    else:
        tasks = [
            loop.create_task(unified_mcping(ip, port, 'status')),
            loop.create_task(unified_mcping(ip, port, 'query')),
            loop.create_task(unified_mcping(ip, port, 'raknet'))
        ]

        done = 0

        while done <= 3:
            for task in tasks:
                if task.done():
                    done += 1
                    result = task.result()
                    if result['online'] == True:
                        return result

            await asyncio.sleep(.01)

        return default

async def handler(r):
    if r.remote not in allowed_ips:
        return web.Response(status=401)  # 401 unauthed

    host = r.query.get('host')
    if host is None:
        return web.Response(status=400)  # 400 bad req

    try:
        port = int(r.query.get('port'))
    except TypeError:
        port = None
    except ValueError:
        port = None

    if port == 0:
        port = None

    status = await unified_mcping(host, port)
    return web.json_response(status)

web_app = web.Application()
web_app.router.add_view('/mcstatus', handler)

loop = asyncio.get_event_loop()
web.run_app(web_app, host='localhost', port=2304) # this is blocking
