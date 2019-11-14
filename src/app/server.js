const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const customRoutes = require('./routes.json');
const customIds = require('./ids.json');
const process = require('process');

function getWrappedResponseBodyWithEntityType(req, responseBody){
  const entityType = getResourceTypeFromPath(req.url);
  const wrappedResponseBody = {};
  wrappedResponseBody[entityType] = responseBody;
  return wrappedResponseBody;
}

function isResourceIdRequest(path){
  for(const source in customRoutes){
    const target = customRoutes[source];
    if(source === path || path === target){
      return false;
    }
  }
  return true;
}

function getResourceId(path){
  return getPathPartFromEnd(path, 0);
}

function getResourceTypeFromPath(path){
  if(isResourceIdRequest(path)){
    return getPathPartFromEnd(path, 1)
  }
  return getPathPartFromEnd(path, 0);
}

function getPathPartFromEnd(path, index){
  const pathParts =  path.split('/');
  return pathParts[pathParts.length - index - 1];
}

function removeInternalIdsFromResponseBody(resourceType, responseBody) {
  if (!customIds[resourceType]) {
    return responseBody;
  }

  if (responseBody instanceof Array) {
    for (let i=0;i<responseBody.length;i++) {
      delete responseBody[i].id;
    }
  } else {
    delete responseBody.id;
  }

  return responseBody;
}

function isCreateOrUpdateRequest(req){
  return req.method === 'POST' || req.method === 'PUT';
}

function isPostUpdateRequest(req){
  const path = req.path;
  return req.method === 'POST' && isResourceIdRequest(path);
}

function changeToPutRequest(req){
  req.method = 'PUT';
}

function addCustomId(req){
  const path = req.path;
  const resourceType = getResourceTypeFromPath(path);
  const id = getResourceId(path);
  const customId = customIds[resourceType];
  if(customId) {
    req.body[customId] = id;
  }
}

process.on('SIGINT', function(){
  process.abort();
});

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
router.render = (req, res) => {
  const path = req.url;
  let responseBody = res.locals.data;
  let resourceType = getResourceTypeFromPath(path);
  responseBody = removeInternalIdsFromResponseBody(resourceType, responseBody);
  responseBody = getWrappedResponseBodyWithEntityType(req,  responseBody);
  res.jsonp(responseBody);
};

server.use((req, res, next) => {
  if (isCreateOrUpdateRequest(req)) {
    if (isPostUpdateRequest(req)){
      addCustomId(req);
      changeToPutRequest(req);
    }
  }
  next();
});

server.use(jsonServer.rewriter(customRoutes));
server.use(middlewares);
server.use(router);
server.listen(3000, () => {
  console.log('Hetzner Robot API Mock is running')
});
