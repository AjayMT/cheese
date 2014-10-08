
/* global console, io, require, module */

var Cheese = {
  routes: {},
  db: {},
  events: {},
  messageHandlers: {},
  socket: {},
  opts: {
    'synchronize db': true,
    'update DOM': true
  }
};

if (typeof require === 'function' && typeof module === 'object') {
  var DOMUtils = require('./dom.js');
  var diffUtils = require('./diff.js');
  var jQuery = require('jquery');
  var io = require('socket.io-client');

  module.exports = Cheese;
}

(function ($, DOM, diff) {
  var applyDiff = diff.applyDiff;
  var createDiff = diff.createDiff;
  var copyObject = diff.copyObject;
  var DOMUtils = DOM;

  if (! io)
    $.ajax('/socket.io/socket.io.js', { async: true }).done(handleMessages);

  var serverDB = {};
  var initialized = false;
  var socket;
  var startup = function () {};
  var domLoaded = false;

  function routeMatchesPattern (pattern, route) {
    pattern = pattern.split('/').filter(function (i) { return i !== ''; });
    route = route.split('/').filter(function (i) { return i !== ''; });

    if (pattern.length !== route.length) return false;

    var args = {};

    for (var i = 0; i < pattern.length; i++)
      if (pattern[i].charAt(0) === ':') args[i] = pattern[i];

    for (var j = 0; j < route.length; j++) {
      if (args[j] === undefined && route[j] !== pattern[j]) return false;
    }

    return true;
  }

  function argsForRoute (pattern, route) {
    if (! routeMatchesPattern(pattern, route)) return [];

    pattern = pattern.split('/').filter(function (i) { return i !== ''; });
    route = route.split('/').filter(function (i) { return i !== ''; });
    var args = [];

    for (var i = 0; i < pattern.length; i++)
      if (pattern[i].charAt(0) === ':') args.push(route[i]);

    return args;
  }

  function updateClient () {
    Cheese.db = copyObject(serverDB);
    Cheese.reload();
  }

  function updateServer () {
    if (! initialized) return;

    if (JSON.stringify(createDiff(serverDB, Cheese.db)) !== '{}') {
      socket.emit('msg', createDiff(serverDB, Cheese.db));
      serverDB = copyObject(Cheese.db);
    }
  }

  function initializeEvents (map) {
    for (var sel in map)
      for (var ev in map[sel])
        $(sel).off(ev).on(ev, createEventHandler(sel, ev, map));
  }

  function createEventHandler (sel, ev, map) {
    return function (e) {
      map[sel][ev](e);
      Cheese.reload();
    };
  }

  function handleMessages () {
    socket = io('http://' + window.location.hostname);

    socket.on('msg', function (diff) {
      if (! Cheese.opts['synchronize db']) return;
      applyDiff(diff, serverDB);
      updateClient();
    });

    socket.on('init', function (db) {
      serverDB = copyObject(db);
      Cheese.db = copyObject(db);
      initialized = true;
      startup();
      Cheese.reload();
      domLoaded = true;
    });

    socket.on('custom', function (msg) {
      if (Cheese.messageHandlers[msg.msg]) Cheese.messageHandlers[msg.msg](msg.args);
      Cheese.reload();
    });

    socket.on('reload', function () {
      window.location.reload(true);
    });
  }

  Cheese.socket.emit = function (m, d) {
    if (initialized) socket.emit('custom', { msg: m, args: d });
    else console.error('The client can only send messages after it has connected to the server.');

    return Cheese;
  };

  Cheese.socket.on = function (m, f) {
    if (typeof m === 'object' && f === undefined)
      for (var msg in m)
        Cheese.messageHandlers[msg] = m[msg];
    else if (typeof m === 'string' && typeof f === 'function')
      Cheese.messageHandlers[m] = f;

    return Cheese;
  };

  Cheese.opt = function (k, v) {
    if (typeof k === 'string' && v === undefined) return Cheese.opts[k];

    if (typeof k === 'object' && v === undefined)
      for (var o in k)
        this.opts[o] = k[o];
    else if (typeof k === 'string' && v !== undefined)
      this.opts[k] = v;

    return Cheese;
  };

  Cheese.reload = function () {
    if (this.opts['synchronize db']) updateServer();

    if (domLoaded && (! this.opts['update DOM'])) return Cheese;

    var route = window.location.pathname;
    var args = [];
    for (var i in this.routes)
      if (routeMatchesPattern(i, window.location.pathname)) {
        args = argsForRoute(i, window.location.pathname);
        route = i;
        break;
      }

    var html = document.createElement('html');
    html.innerHTML = this.routes[route].apply(window, args);
    DOMUtils.updateDOMElement($('html'), $(html));
    initializeEvents(this.events);

    return Cheese;
  };

  Cheese.request = function (name, callback) {
    if (typeof callback === 'function') {
      $.ajax('/__static/' + name, { async: true }).done(callback);
      return Cheese;
    }

    var content;
    $.ajax('/__static/' + name, { async: false }).done(function (data) { content = data; });
    return content;
  };

  Cheese.route = function (r, f) {
    if (typeof r === 'object' && f === undefined)
      for (var p in r) {
        this.routes[p] = r[p];
        if (routeMatchesPattern(p, window.location.pathname)) this.reload();
      }
    else if (typeof r === 'string' && typeof f === 'function') {
      this.routes[r] = f;
      if (routeMatchesPattern(r, window.location.pathname)) this.reload();
    }

    return Cheese;
  };

  Cheese.startup = function (f) {
    startup = f;

    return Cheese;
  };

  Cheese.event = function (event, selector, handler) {
    if (typeof event === 'object' &&
        selector === undefined && handler === undefined) {
      var map = event;

      for (var sel in map) {
        if (! this.events[sel]) this.events[sel] = {};

        for (var ev in map[sel])
          this.events[sel][ev] = map[sel][ev];
      }
    } else if (typeof selector === 'string' &&
               typeof event === 'string' && typeof handler === 'function') {
      if (! this.events[selector]) this.events[selector] = {};

      this.events[selector][event] = handler;
    }

    if (domLoaded) initializeEvents(this.events);

    return Cheese;
  };
})(jQuery, DOMUtils, diffUtils);

delete window.diffUtils;
delete window.DOMUtils;
delete window.jQuery;
delete window.$;
delete window.io;
