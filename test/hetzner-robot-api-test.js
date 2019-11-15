const hetznerRobotApi = require('../src/app/hetzner-robot-api');
const jsonServer = require('json-server');
const router = jsonServer.router('./test/db.json');
const mocha = require("mocha");
const port = 3333;
const request = require("request");
const assert = require('assert');
const baseUrl = 'http://localhost:' + port;
const template = require('./firewall_template');

let describe = mocha.describe;
let before = mocha.before;
let after = mocha.after;
let it = mocha.it;

let httpServer;
before(function () {
  httpServer = hetznerRobotApi.listen(port, router);
});

after(function () {
  httpServer.close();
});

describe('Firewall template ', function () {
  it("Should save new.", function(done) {
    request.post({"url": baseUrl + "/firewall_template", "form": template }, function(error, response, body) {
      assert.equal(201, response.statusCode);
      const actualTemplate = toJson(body).firewall_template;
      delete actualTemplate.id;
      assert.deepEqual(actualTemplate, template)
      done();
    });
  });
});

function toJson(str){
  return JSON.parse(str);
}

function jsonEqual(a,b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
