var fs = require('fs');
var path = require('path');
var dbFile;

var Cheese = {
  db: {},
  staticData: {},
  messageHandlers: {}
};

Cheese.response = function (url, callback) {
  this.staticData[url] = callback;
};

Cheese.connect = function (f) {
  this.connectHandler = f;
}

Cheese.disconnect = function (f) {
  this.disconnectHandler = f;
}

Cheese.on = function (msg, f) {
  this.messageHandlers[msg] = f;
}

Object.defineProperty(Cheese, 'dbFile', {
  get: function () {
    return dbFile;
  },
  set: function (newPath) {
    dbFile = path.resolve(newPath);

    if (fs.existsSync(dbFile))
      Cheese.db = JSON.parse(fs.readFileSync(dbFile, { encoding: 'utf-8' }));
    else
      fs.writeFileSync(dbFile, JSON.stringify(Cheese.db));
  }
});

module.exports = Cheese;
