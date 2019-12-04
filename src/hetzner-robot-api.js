const jsonServer = require('json-server');
const server = jsonServer.create();
const defaultRouter = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const customRoutes = require('./routes.json');
const customIds = require('./ids.json');
const defaults = require('./defaults');
const responsesConfig = require('./responses');
const requestsConfig = require('./requests');
const basicAuth = require('express-basic-auth');
const users = { 'robot': 'secret' };
const vSwitchRequestHandler = require('./vswitch-request-handler');
let router = defaultRouter;

function getWrappedResponseBody(req, responseBody){
  const entityType = getResourceType(req);
  if(responseBody instanceof Array){
    const result = [];
    for(const i in responseBody){
      result.push(wrapObjWithEntityType(responseBody[i], entityType))
    }
    return result;
  }
  return wrapObjWithEntityType(responseBody, entityType);
}

function wrapObjWithEntityType(obj, entityType){
  const wrappedResponseBody = {};
  wrappedResponseBody[entityType] = obj;
  return wrappedResponseBody;
}

function getResourceType(req){
  const resourceId = getResourceId(req);
  const path = req.rewritePath;
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
  return req.originalParams ? req.originalParams.id : undefined;
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

function isWrapResponse(resourceType){
  const responseConfig = responsesConfig[resourceType];
  if(responseConfig){
    return responseConfig.wrap !== false
  }

  return true;
}

function isAlwaysUpdateResource(req){
  const resourceType = getResourceType(req);
  const requestConfig = requestsConfig[resourceType];
  if(requestConfig){
    return requestConfig.alwaysUpdate !== false
  }

  return true;
}

function handleHetznerRobotApiRequest(req, res, next){
  req.originalParams = req.params;
  req.rewritePath = req.baseUrl;

  if (isCreateOrUpdateRequest(req)) {
    addCustomIdToRequestBody(req);
    if (isPostUpdateRequest(req)) {
      if (isAlwaysUpdateResource(req)) {
        changeToPatchRequest(req);
      } else {
        changeToPutRequest(req);
      }
    }
  } else if (isDeleteRequest(req)) {
    const resourceDefaults = getResourceDefaults(req);
    if (resourceDefaults) {
      setBodyToResourceDefaults(req, resourceDefaults);
      addCustomIdToRequestBody(req);
      changeToPutRequest(req);
    }
  }

  if (vSwitchRequestHandler.matches(req)){
    vSwitchRequestHandler.handle(req, router.db);
  }

  next();
}

function init(router){
  if(!router){
    router = defaultRouter;
  }
  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(bodyParser.json());
  router.render = (req, res) => {
    let responseBody = res.locals.data;
    let resourceType = getResourceType(req);
    responseBody = removeInternalIdsFromResponseBody(resourceType, responseBody);
    if(isWrapResponse(resourceType)) {
      responseBody = getWrappedResponseBody(req, responseBody);
    }
    res.jsonp(responseBody);
  };
  server.use(basicAuth({
    users: users
  }));
  server.use(function(req, res, next){
    req.originalPath = req.url;
    next();
  });
  server.use(jsonServer.rewriter(customRoutes));
  applyRequestMiddlewareToCustomRoutes();
  server.use(middlewares);
  server.use(router);
}

exports.listen = function(port, customRouter){
  router = customRouter;
  init(customRouter);
  return server.listen(port, () => {
    console.log('Hetzner Robot API Mock is running')
  });
};
