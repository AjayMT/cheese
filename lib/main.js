
/* global module, require */

var fs = require('fs');
var path = require('path');

var diff = require('./diff.js');

// Initialization
var Cheese = {
  db: {},
  staticData: {},
  messageHandlers: {},
  opts: {
    'synchronize db': true
  },
  filters: [{
    func: function (diff) { return diff; },
    each: false
  }],
  allowFunc: function () { return true; }
};

// Set up a DB file
function setupDBFile (f) {
  f = path.resolve(f);

  if (fs.existsSync(f))
    Cheese.db = JSON.parse(fs.readFileSync(f, { encoding: 'utf-8' }));
  else
    fs.writeFileSync(f, JSON.stringify(Cheese.db));
}

// Server API functions
Cheese.response = function (url, callback) {
  if (typeof url === 'object' && callback === undefined)
    for (var r in url)
      this.staticData[r] = url[r];
  else if (typeof url === 'string')
    this.staticData[url] = callback;

  return Cheese;
}

Cheese.connected = function (f) {
  this.connectHandler = f;

  return Cheese;
}

Cheese.disconnected = function (f) {
  this.disconnectHandler = f;

  return Cheese;
}

Cheese.on = function (msg, f) {
  if (typeof msg === 'object' && f === undefined)
    for (var m in msg)
      this.messageHandlers[m] = msg[m];
  else if (typeof msg === 'string')
    this.messageHandlers[msg] = f;

  return Cheese;
}

Cheese.filter = function (eachOrFilter, filter) {
  if (typeof eachOrFilter !== 'function') {
    var filterInfo = {
      each: eachOrFilter,
      func: filter
    };

    this.filters.push(filterInfo);
  } else this.filters.push({ func: eachOrFilter });

  return Cheese;
}

Cheese.allow = function (f) {
  this.allowFunc = f;

  return Cheese;
}

Cheese.opt = function (k, v) {
  if (v === undefined && typeof k === 'string') return this.opts[k];

  if (typeof k === 'object' && v === undefined)
    for (var o in k) {
      this.opts[o] = k[o];
      if (o === 'db file path') setupDBFile(k[o]);
    }
  else if (typeof k === 'string' && v !== undefined)
    this.opts[k] = v;
  if (k === 'db file path') setupDBFile(v);

  return Cheese;
};

Cheese.use = function (f) {
  if (typeof f === 'object')
    for (var i in f) this.use(f[i]);
  else if (typeof f === 'string')
    this.use(function () {
      Cheese = require(path.resolve(f));

      return Cheese;
    });
  else if (typeof f === 'function') {
    var newCheese = f(diff.copyObject(this));
    var changes = diff.createDiff(this, newCheese);
    diff.applyDiff(changes, this);
  }

  return Cheese;
};

module.exports = Cheese;
