/* global module, require */

var fs = require('fs');
var path = require('path');
var dbFilePath;

var Cheese = {
  db: {},
  staticData: {},
  messageHandlers: {}
};

Cheese.response = function (url, callback) {
  this.staticData[url] = callback;
};

Cheese.connected = function (f) {
  this.connectHandler = f;
}

Cheese.disconnected = function (f) {
  this.disconnectHandler = f;
}

Cheese.on = function (msg, f) {
  this.messageHandlers[msg] = f;
}

Object.defineProperty(Cheese, 'dbFilePath', {
  get: function () {
    return dbFilePath;
  },
  set: function (newPath) {
    dbFilePath = path.resolve(newPath);

    if (fs.existsSync(dbFilePath))
      Cheese.db = JSON.parse(fs.readFileSync(dbFilePath, { encoding: 'utf-8' }));
    else
      fs.writeFileSync(dbFilePath, JSON.stringify(Cheese.db));
  }
});

module.exports = Cheese;
