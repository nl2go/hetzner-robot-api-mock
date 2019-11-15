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
  const entityType = getResourceType(req);
  const wrappedResponseBody = {};
  wrappedResponseBody[entityType] = responseBody;
  return wrappedResponseBody;
}

function getResourceType(req){
  const resourceId = getResourceId(req);
  const path = req.custom_path;
  if(resourceId){
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

  const responseBodyClone = clone(responseBody);
  if (responseBodyClone instanceof Array) {
    for (let i=0;i<responseBodyClone.length;i++) {
      delete responseBodyClone[i].id;
    }
  } else {
    delete responseBodyClone.id;
  }

  return responseBodyClone;
}

function isCreateOrUpdateRequest(req){
  return req.method === 'POST' || req.method === 'PUT';
}

function isPostUpdateRequest(req){
  return req.method === 'POST' && getResourceId(req);
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

function getResourceId(req){
  return req.custom_params ? req.custom_params.id : undefined;
}

function addCustomIdToRequestBody(req){
  const resourceType = getResourceType(req);
  const customIdName = customIds[resourceType];
  let id = getResourceId(req);

  if(customIdName) {
    if(!id){
      id = req.body[customIdName];
    }
    req.body.id = id;
    req.body[customIdName] = id;
  }
}

function getResourceDefaults(req){
  const resourceType = getResourceType(req);
  return defaults[resourceType];
}

function setBodyToResourceDefaults(req, resourceDefaults){
  req.body = clone(resourceDefaults);
}

function applyRequestMiddlewareToCustomRoutes(){
  for(const source in customRoutes){
    const target = customRoutes[source];
    server.use(target, handleHetznerRobotApiRequest);
  }
}

function handleHetznerRobotApiRequest(req, res, next){
  req.custom_params = req.params;
  req.custom_path = req.baseUrl;

  if (isCreateOrUpdateRequest(req)) {
    addCustomIdToRequestBody(req);
    if (isPostUpdateRequest(req)) {
      changeToPatchRequest(req);
    }
  } else if (isDeleteRequest(req)){
    const resourceDefaults = getResourceDefaults(req);
    if(resourceDefaults){
      setBodyToResourceDefaults(req, resourceDefaults);
      addCustomIdToRequestBody(req);
      changeToPutRequest(req);
    }
  }
  next();
}

process.on('SIGINT', function(){
  process.abort();
});
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
router.render = (req, res) => {
  let responseBody = res.locals.data;
  let resourceType = getResourceType(req);
  responseBody = removeInternalIdsFromResponseBody(resourceType, responseBody);
  responseBody = getWrappedResponseBodyWithEntityType(req,  responseBody);
  res.jsonp(responseBody);
};
server.use(jsonServer.rewriter(customRoutes));
applyRequestMiddlewareToCustomRoutes();
server.use(middlewares);
server.use(router);
server.listen(3000, () => {
  console.log('Hetzner Robot API Mock is running')
});
