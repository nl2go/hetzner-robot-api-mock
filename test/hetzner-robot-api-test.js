const hetznerRobotApi = require('../src/hetzner-robot-api');
const databaseFilePath = './test/db.json';
const jsonServer = require('json-server');
const mocha = require('mocha');
const port = 3333;
const request = require('request');
const assert = require('assert');
const baseUrl = 'http://localhost:' + port;
const resources = require('./resources');
const fs = require('fs');

let describe = mocha.describe;
let before = mocha.before;
let after = mocha.after;
let it = mocha.it;
let httpServer;

before(function () {
  initFileDatabase(resources)
  const router = jsonServer.router(databaseFilePath);
  httpServer = hetznerRobotApi.listen(port, router);
});

after(function () {
  httpServer.close();
});

for (const resourceType in resources){
  const definition = resources[resourceType];
  const data = definition['data'];
  const idKey = definition['id'];
  const defaultData = definition['defaultData'];
  const url = baseUrl + '/' + resourceType;

  describe(resourceType, function () {
    it('Create', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        assert.equal(201, response.statusCode);
        const actualData = toJson(body)[resourceType];
        delete actualData['id'];
        assert.deepEqual(actualData, data);
        done();
      }));
    });

    it('Get', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        const actualData = toJson(body)[resourceType];
        auth(request.get(url + '/' + actualData[idKey], function (error, response, body) {
          assert.equal(200, response.statusCode);
          const actualData = toJson(body)[resourceType];
          delete actualData['id'];
          assert.deepEqual(actualData, data);
          done();
        }));
      }));
    });

    it('Update', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        const actualData = toJson(body)[resourceType];
        actualData['foo'] = 'bar';
        auth(request.post({'url': url + '/' + actualData[idKey], 'form': actualData}, function (error, response, body) {
          assert.equal(200, response.statusCode);
          const actualData = toJson(body)[resourceType];
          assert.equal(actualData['foo'], 'bar');
          delete actualData['id'];
          delete actualData['foo'];
          assert.deepEqual(actualData, data);
          done();
        }));
      }));
    });

    it('Delete', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        const actualData = toJson(body)[resourceType];
        auth(request.delete(url + '/'  + actualData[idKey], function (error, response, body) {
          assert.equal(200, response.statusCode);
          if(defaultData){
            const actualData = toJson(body)[resourceType];
            delete actualData[idKey];
            assert.deepEqual(actualData, defaultData);
          } else {
            const emptyData = {};
            emptyData[resourceType] = {};
            assert.deepEqual(toJson(body), emptyData);
          }
          done();
        }));
      }));
    });
  });
}

function auth(request){
  return request.auth('robot', 'secret', true);
}

function randomIpAsIdIfCustomIdField(idKey, data){
  if(idKey !== 'id'){
    data[idKey] = randomIp();
  }
}

function toJson(str) {
  return JSON.parse(str);
}

function randomIp(){
  return randomOctet() + '.' + randomOctet() + '.' + randomOctet() + '.' + randomOctet();
}

function randomOctet(){
  return Math.floor(Math.random() * 255);
}

function initFileDatabase(resources){
  let data = {};
  for (resourceType in resources){
    data[resourceType] = [];
  }
  fs.writeFileSync(databaseFilePath, JSON.stringify(data));
}

