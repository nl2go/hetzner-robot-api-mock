const hetznerRobotApi = require('hetzner-robot-api');
const process = require('process');

const server = hetznerRobotApi.listen(3000);

process.on('SIGINT', function(){
  server.close();
});
