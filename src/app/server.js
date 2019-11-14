const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const customRoutes = require('./routes.json');
const process = require('process');

function getWrappedResponseBodyWithEntityType(req, responseBody){
  const entityType = getEntityTypeFromPath(req.url);
  const wrappedResponseBody = {};
  wrappedResponseBody[entityType] = responseBody;
  return wrappedResponseBody;
}

function isSearchRequest(path){
  const parts = path.split('?');
  return parts.length > 1;
}

function isCustomRoute(path){
  const currentTarget = getPathWithoutQuery(path);
  for(const source in customRoutes) {
    const target = getPathWithoutQuery(customRoutes[source]);
    if (currentTarget === target) {
      return true
    }
  }
  return false;
}

function getUnwrappedResponseBody(responseBody){
  if(responseBody.length > 0){
    return responseBody[0];
  }
  return {};
}

function getPathWithoutQuery(path){
  return path.split('?')[0];
}

function getEntityTypeFromPath(path){
  return getPathWithoutQuery(path).split("/")[1];
}

process.on('SIGINT', function(){
  process.abort();
});

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
router.render = (req, res) => {
  const path = req.url;
  let responseBody = res.locals.data;
  if(isSearchRequest(path) && isCustomRoute(path)){
    responseBody = getUnwrappedResponseBody(responseBody);
  }
  responseBody = getWrappedResponseBodyWithEntityType(req,  responseBody);

  res.jsonp(responseBody);
};
server.use(jsonServer.rewriter(customRoutes));
server.use(middlewares);
server.use(router);
server.listen(3000, () => {
  console.log('Hetzner Robot API Mock is running')
});
