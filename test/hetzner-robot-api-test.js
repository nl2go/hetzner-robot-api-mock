const hetznerRobotApi = require('../src/hetzner-robot-api');
const databaseFilePath = './test/db.json';
const jsonServer = require('json-server');
const mocha = require('mocha');
const port = 3333;
const request = require('request');
const assert = require('assert');
const baseUrl = 'http://localhost:' + port;
const resources = require('./resources');
const responsesConfig = require('../src/responses');
const fs = require('fs');

let describe = mocha.describe;
let before = mocha.before;
let after = mocha.after;
let it = mocha.it;
let httpServer;

before(function () {
  initFileDatabase(resources);
  const router = jsonServer.router(databaseFilePath);
  httpServer = hetznerRobotApi.listen(port, router);
});

after(function () {
  httpServer.close();
});

for (const resourceType in resources) {
  const definition = resources[resourceType];
  const data = definition['data'];
  const idKey = definition['id'] || 'id';
  const defaultData = definition['defaultData'];
  const url = baseUrl + '/' + resourceType;

  describe(resourceType, function () {
    it('Create', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        assert.equal(201, response.statusCode);
        const actualData = getBodyAsJson(body, resourceType);
        delete actualData['id'];
        assert.deepEqual(actualData, data);
        done();
      }));
    });

    it('Get All', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        const actualData = getBodyAsJson(body, resourceType);
        auth(request.get(url, function (error, response, body) {
          assert.equal(200, response.statusCode);
          const actualData = getBodyAsJson(body, resourceType);
          assert.equal(actualData instanceof Array, true);
          assert.equal(actualData.length >=1, true);
          done();
        }));
      }));
    });

    it('Get', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        const actualData = getBodyAsJson(body, resourceType);
        auth(request.get(url + '/' + actualData[idKey], function (error, response, body) {
          assert.equal(200, response.statusCode);
          const actualData = getBodyAsJson(body, resourceType);
          delete actualData['id'];
          assert.deepEqual(actualData, data);
          done();
        }));
      }));
    });

    it('Update', function (done) {
      randomIpAsIdIfCustomIdField(idKey, data);
      auth(request.post({'url': url, 'form': data}, function (error, response, body) {
        const actualData = getBodyAsJson(body, resourceType);
        actualData['foo'] = 'bar';
        auth(request.post({
          'url': url + '/' + actualData[idKey],
          'form': actualData
        }, function (error, response, body) {
          assert.equal(200, response.statusCode);
          const actualData = getBodyAsJson(body, resourceType);
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
        const actualData = getBodyAsJson(body, resourceType);
        auth(request.delete(url + '/'  + actualData[idKey], function (error, response, body) {
          assert.equal(200, response.statusCode);
          if(defaultData){
            const actualData = getBodyAsJson(body, resourceType);
            delete actualData[idKey];
            assert.deepEqual(actualData, defaultData);
          } else {
            const emptyData = getEmptyBodyAsJson(resourceType);
            assert.deepEqual(toJson(body), emptyData);
          }
          done();
        }));
      }));
    });

    if (resourceType === 'vswitch') {
      it('Add Server', function (done) {
        const servers = {'server': ["111.111.111.111"]};
        randomIpAsIdIfCustomIdField(idKey, data);
        auth(request.post({'url': url, 'form': data}, function (error, response, body) {
          assert.equal(201, response.statusCode);
          const actualData = getBodyAsJson(body, resourceType);
          auth(request.post({
            'url': url + '/' + actualData[idKey] + '/server',
            'form': servers
          }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            const expectedData = clone(data);
            expectedData['server'].push({'server_ip': '111.111.111.111', 'status': 'ready'});
            const actualData = getBodyAsJson(body, resourceType);
            delete actualData['id'];
            assert.deepEqual(expectedData, actualData);
            done();
          }));
        }));
      });

      it('Remove Server', function (done) {
        const servers = {'server': ["123.123.123.123"]};
        randomIpAsIdIfCustomIdField(idKey, data);
        auth(request.post({'url': url, 'form': data}, function (error, response, body) {
          assert.equal(201, response.statusCode);
          const actualData = getBodyAsJson(body, resourceType);
          auth(request.delete({
            'url': url + '/' + actualData[idKey] + '/server',
            'form': servers
          }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            const expectedData = clone(data);
            expectedData['server'] = [];
            const actualData = getBodyAsJson(body, resourceType);
            delete actualData['id'];
            assert.deepEqual(expectedData, actualData);
            done();
          }));
        }));
      });
    }
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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function randomIp(){
  return randomOctet() + '.' + randomOctet() + '.' + randomOctet() + '.' + randomOctet();
}

function randomOctet(){
  return Math.floor(Math.random() * 255);
}

function initFileDatabase(resources){
  let data = {};
  for (const resourceType in resources){
    data[resourceType] = [];
  }
  fs.writeFileSync(databaseFilePath, JSON.stringify(data));
}

function getBodyAsJson(body, resourceType){
  const bodyJson = toJson(body);

  if(isWrapResponse(resourceType)){
    if(bodyJson instanceof Array) {
      const result = [];
      for (const i in bodyJson){
        result.push(bodyJson[i][resourceType])
      }
      return result;
    }
    return bodyJson[resourceType];
  }
  return bodyJson;
}

function getEmptyBodyAsJson(resourceType){
  if(isWrapResponse(resourceType)){
    const emptyData = {};
    emptyData[resourceType] = {};
    return emptyData;
  }
  return {};
}

function isWrapResponse(resourceType){
  const responseConfig = responsesConfig[resourceType];
  if(responseConfig){
    return responseConfig.wrap !== false
  }

  return true;
}

