const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const custom_routes = require('./routes.json');
const process = require('process');

function wrapResponseBodyWithEntityType(req, res){
  const entityType = getEntityTypeFromPath(req.url);
  const responseBody = {};
  responseBody[entityType] = res.locals.data;
  res.jsonp(responseBody);
}

function getEntityTypeFromPath(path){
  return path.split("/")[1];
}

process.on('SIGINT', function(){
  process.abort();
});

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use((req, res, next) => {
  next()
});

router.render = (req, res) => {
  wrapResponseBodyWithEntityType(req, res);
};
server.use(jsonServer.rewriter(custom_routes));
server.use(middlewares);
server.use(router);
server.listen(3000, () => {
  console.log('Hetzner Robot API Mock is running')
});
