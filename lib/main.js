
/* global module, require */

var fs = require('fs');
var path = require('path');

// File which Cheese.db is written to and read from
var dbFilePath;

// Initialization
var Cheese = {
  db: {},
  staticData: {},
  messageHandlers: {},
  filterInfo: {
    func: function (diff) { return diff; },
    each: false
  },
  allowFunc: function () { return true; }
};

// Server API functions
Cheese.response = function (url, callback) {
  this.staticData[url] = callback;
}

Cheese.connected = function (f) {
  this.connectHandler = f;
}

Cheese.disconnected = function (f) {
  this.disconnectHandler = f;
}

Cheese.on = function (msg, f) {
  this.messageHandlers[msg] = f;
}

Cheese.filter = function (eachOrFilter, filter) {
  if (typeof eachOrFilter !== 'function') {
    this.filterInfo.each = eachOrFilter;
    this.filterInfo.func = filter;
  } else this.filterInfo.func = eachOrFilter;
}

Cheese.allow = function (f) {
  this.allowFunc = f;
}

// dbFilePath property
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
