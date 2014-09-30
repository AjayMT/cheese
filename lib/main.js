
/* global module, require */

var fs = require('fs');
var path = require('path');

// Initialization
var Cheese = {
  db: {},
  staticData: {},
  messageHandlers: {},
  opts: {
    'synchronize db': true
  },
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

Cheese.set = function (k, v) {
  this.opts[k] = v;

  if (k === 'db file path') {
    var filePath = path.join(v);

    if (fs.existsSync(filePath))
      Cheese.db = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }));
    else
      fs.writeFileSync(filePath, JSON.stringify(Cheese.db));
  }
};

module.exports = Cheese;
