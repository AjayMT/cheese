
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
  var jQuery = require('./jquery-1.10.2.min.js');
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
  };

  function initializeEvents () {
    for (var selector in Cheese.events)
      for (var event in Cheese.events[selector])
        $(selector).off(event, selector)
        .on(event, Cheese.events[selector][event]);
  }

  function createEventHandler (sel, ev, map) {
    return function (e) {
      console.log(sel, ev, map[sel][ev]);
      map[sel][ev](e);
      Cheese.reload();
    }
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
  };

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
        Cheese.opts[o] = k[o];
    else if (typeof k === 'string' && v !== undefined)
      Cheese.opts[k] = v;

    return Cheese;
  };

  Cheese.reload = function () {
    if (Cheese.opts['synchronize db']) updateServer();

    if (domLoaded && (! Cheese.opts['update DOM'])) return Cheese;

    var route = window.location.pathname;
    var args = [];
    for (var i in Cheese.routes)
      if (routeMatchesPattern(i, window.location.pathname)) {
        args = argsForRoute(i, window.location.pathname);
        route = i;
        break;
      }

    var html = document.createElement('html');
    html.innerHTML = Cheese.routes[route].apply(window, args);
    DOMUtils.updateDOMElement($('html'), $(html));
    initializeEvents();

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
        Cheese.routes[p] = r[p];
        if (routeMatchesPattern(p, window.location.pathname)) Cheese.reload();
      }
    else if (typeof r === 'string' && typeof f === 'function') {
      Cheese.routes[r] = f;
      if (routeMatchesPattern(r, window.location.pathname)) Cheese.reload();
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
        if (! Cheese.events[sel]) Cheese.events[sel] = {};

        for (var ev in map[sel])
          Cheese.events[sel][ev] = createEventHandler(sel, ev, map);
      }
    } else if (typeof selector === 'string' &&
               typeof event === 'string' && typeof handler === 'function') {
      if (! Cheese.events[selector]) Cheese.events[selector] = {};

      Cheese.events[selector][event] = function (e) {
        handler(e);
        Cheese.reload();
      };
    }

    if (domLoaded) initializeEvents();

    return Cheese;
  };
})(jQuery, DOMUtils, diffUtils);

delete window.diffUtils;
delete window.DOMUtils;
delete window.jQuery;
delete window.$;
delete window.io;
