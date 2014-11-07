
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
  var EZDOM = require('ezdom');
  var diffUtils = require('cdp-diff');
  var jQuery = require('jquery');
  var io = require('socket.io-client');

  module.exports = Cheese;
}

(function ($, DOM, diff) {
  var applyDiff = diff.applyDiff;
  var createDiff = diff.createDiff;
  var copyObject = diff.copyObject;
  var EZDOM = DOM;

  if (! io)
    $.ajax('/socket.io/socket.io.js', { async: true }).done(handleMessages);
  else handleMessages();

  var serverDB = {};
  var initialized = false;
  var socket;
  var startup = [];
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
    $('*').off();

    for (var sel in map)
      for (var ev in map[sel])
        for (var h in map[sel][ev])
          $(sel).on(ev, createEventHandler(map[sel][ev][h]));
  }

  function createEventHandler (f) {
    return function (e) {
      f(e);
      Cheese.reload();
    };
  }

  function handleMessages () {
    socket = io(window.location.origin.split('://')[0] + '://'
               + window.location.hostname);

    socket.on('msg', function (diff) {
      if (! Cheese.opts['synchronize db']) return;
      applyDiff(diff, serverDB);
      updateClient();
    });

    socket.on('init', function (db) {
      serverDB = copyObject(db);
      Cheese.db = copyObject(db);
      initialized = true;

      for (var f in startup) startup[f]();

      Cheese.reload();
      domLoaded = true;
    });

    socket.on('custom', function (msg) {
      if (Cheese.messageHandlers[msg.msg])
        for (var h in Cheese.messageHandlers[msg.msg])
          Cheese.messageHandlers[msg.msg][h](msg.args);

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
      for (var msg in m) {
        if (! Cheese.messageHandlers[msg])
          Cheese.messageHandlers[msg] = [];

        Cheese.messageHandlers[msg].push(m[msg]);
      }
    else if (typeof m === 'string' && typeof f === 'function') {
      if (! Cheese.messageHandlers[m])
        Cheese.messageHandlers[m] = [];

      Cheese.messageHandlers[m].push(f);
    }

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
    EZDOM.updateElement($('html'), $(html));
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

  Cheese.startup = function (f, call) {
    if (typeof f === 'object') {
      startup = startup.concat(f);

      if (initialized && call)
        for (var g in f) f[g]();
    } else if (typeof f === 'function') {
      startup.push(f);

      if (initialized && call) f();
    }

    return Cheese;
  };

  Cheese.event = function (event, selector, handler) {
    if (typeof event === 'object' &&
        selector === undefined && handler === undefined) {
      var map = event;

      for (var sel in map) {
        if (this.events[sel] === undefined) this.events[sel] = {};

        for (var ev in map[sel]) {
          if (this.events[sel][ev] === undefined)
            this.events[sel][ev] = [];

          this.events[sel][ev].push(map[sel][ev]);
        }
      }
    } else if (typeof selector === 'string' &&
               typeof event === 'string' && typeof handler === 'function') {
      if (this.events[selector] === undefined) this.events[selector] = {};
      if (this.events[selector][event] == undefined)
        this.events[selector][event] = [];

      this.events[selector][event].push(handler);
    }

    if (domLoaded) initializeEvents(this.events);

    return Cheese;
  };
})(jQuery, EZDOM, diffUtils);

delete window.diffUtils;
delete window.EZDOM;
delete window.jQuery;
delete window.$;
delete window.io;
