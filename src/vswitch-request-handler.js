const resourceType = 'vswitch';

function asServerMap(servers){
  return new Map(servers.map(server => [server.server_ip, server]));
}

function asServerList(serverMap){
  return Array.from(serverMap.values());
}

function getResourceId(req){
  return req.originalParams ? req.originalParams.id : undefined;
}

function addServersToSwitch(vswitch, servers){
  const currentServers = vswitch.server;
  const currentServerMap = asServerMap(currentServers);
  for(const index in servers){
    const server = servers[index];
    if(typeof server === 'string') {
        if (!currentServerMap.has(server)) {
          currentServerMap.set(server, {'server_ip': server, 'status': 'ready'});
        }
    }
  }

  vswitch.server = asServerList(currentServerMap);
}

function get(db, resourceType, id){
  return db.get(resourceType)
    .find({'id': id})
    .value();
}

function save(db, resourceType, vswitch, id){
  db.get(resourceType)
    .find({'id': id})
    .assign(vswitch)
    .write();
}

function removeServersFromSwitch(vswitch, servers){
  const currentServers = vswitch.server;
  const currentServerMap = asServerMap(currentServers);
  for(const index in servers){
    const server = servers[index];
    if(currentServerMap.has(server)){
      currentServerMap.delete(server);
    }
  }
  vswitch.server = asServerList(currentServerMap);
}

function changeToGetRequest(req){
  req.method = 'GET';
  delete req.body;
}

function matches(req){
  return isPathMatches(req)
    && isParamsSet(req)
    && isBodyServer(req);
}

function isBodyServer(req){
  return req.body
    && req.body.server;
}

function isParamsSet(req){
  return Object.keys(req.originalParams).length > 0;
}

function isPathMatches(req){
  const path = req.originalPath;
  return path.startsWith('/' + resourceType + '/')
    && path.endsWith('/server')
}

function handle(req, db){
  const id = parseInt(getResourceId(req));
  let vswitch = get(db, resourceType, id);
  const servers = req.body.server;

  if(req.method === 'DELETE'){
    vswitch = removeServersFromSwitch(vswitch, servers);
  } else {
    vswitch = addServersToSwitch(vswitch, servers);
  }

  save(db, resourceType, vswitch);
  changeToGetRequest(req);
}

exports.handle = handle;
exports.matches = matches;
