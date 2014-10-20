
/* global module, require */

var fs = require('fs');
var path = require('path');
var events = require('events');

var _ = require('lodash');

var diff = require('cdp-diff');

// Initialization
var Cheese = new events.EventEmitter();

_.assign(Cheese, {
  db: {},
  staticData: {},
  opts: {
    'synchronize db': true
  },
  filters: {
    all: [function (diff) { return diff; }],
    each: []
  },
  allows: [function () { return true; }]
});

// Set up a DB file
function setupDBFile (f) {
  f = path.resolve(f);

  if (fs.existsSync(f))
    Cheese.db = JSON.parse(fs.readFileSync(f, { encoding: 'utf-8' }));
  else
    fs.writeFileSync(f, JSON.stringify(Cheese.db));
}

// Server API functions
Cheese.on = function (event, handler) {
  if (typeof event === 'object')
    for (var e in event)
      events.EventEmitter.prototype.on.call(this, e, event[e]);
  else if (typeof event === 'string')
    events.EventEmitter.prototype.on.call(this, event, handler);

  return Cheese;
}

Cheese.response = function (url, callback) {
  if (typeof url === 'object' && callback === undefined)
    for (var r in url)
      this.staticData[r] = url[r];
  else if (typeof url === 'string')
    this.staticData[url] = callback;

  return Cheese;
}

Cheese.filter = function (eachOrFilter, filter) {
  if (typeof eachOrFilter === 'object')
    for (var f in eachOrFilter)
      this.filter(eachOrFilter[f]);
  else if (typeof filter === 'object')
    for (var m in filter)
      this.filter(eachOrFilter, filter[m]);
  else if (typeof eachOrFilter === 'boolean') {
    var type = (eachOrFilter ? 'each' : 'all')

    this.filters[type].push(filter);
  } else this.filters.all.push(eachOrFilter);

  return Cheese;
}

Cheese.allow = function (f) {
  if (typeof f === 'object')
    for (var r in f) this.allow(f[r]);
  else if (typeof f === 'function')
    this.allows.push(f);

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
