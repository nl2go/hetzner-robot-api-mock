const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const customRoutes = require('./routes.json');
const customIds = require('./ids.json');
const process = require('process');
const defaults = require('./defaults');

function getWrappedResponseBodyWithEntityType(req, responseBody){
  const entityType = getResourceTypeFromPath(req.url);
  const wrappedResponseBody = {};
  wrappedResponseBody[entityType] = responseBody;
  return wrappedResponseBody;
}

function isResourceIdRequest(path){
  for(const source in customRoutes){
    const target = customRoutes[source];
    if(path === target){
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

function isDeleteRequest(req){
  return req.method === 'DELETE';
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

function changeToPatchRequest(req){
  req.method = 'PATCH';
}

function changeToPutRequest(req){
  req.method = 'PUT';
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function addCustomIdToRequestBody(req){
  const path = req.path;
  const resourceType = getResourceTypeFromPath(path);
  const id = getResourceId(path);
  const customIdName = customIds[resourceType];
  if(customIdName) {
    req.body.id = id;
    req.body[customIdName] = id;
  }
}

function getResourceDefaults(req){
  const path = req.path;
  const resourceType = getResourceTypeFromPath(path);
  return defaults[resourceType];
}

function setBodyToResourceDefaults(req, resourceDefaults){
  req.body = clone(resourceDefaults);
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
    if (isPostUpdateRequest(req)) {
      addCustomIdToRequestBody(req);
      changeToPatchRequest(req);
    }
  } else if (isDeleteRequest(req)){
    const resourceDefaults = getResourceDefaults();
    if(resourceDefaults){
      setBodyToResourceDefaults(req, resourceDefaults);
      addCustomIdToRequestBody(req);
      changeToPutRequest();
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
