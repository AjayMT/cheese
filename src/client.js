var Cheese = {
  routes: {},
  db: {},
  events: {},
  messageHandlers: {}
};

(function ($, DOM, diff) {
  var applyDiff = diff.applyDiff;
  var createDiff = diff.createDiff;
  var copyObject = diff.copyObject;
  var DOMUtils = DOM;

  $.ajax('/socket.io/socket.io.js', { async: false }).done(handleMessages);

  var serverDB = {};
  var socket;
  var initialized = false;
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
      console.log(args[j], route[j], pattern[j]);
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
      $(selector).off(Cheese.events[selector]).on(Cheese.events[selector]);
  }

  function handleMessages () {
    socket = io('http://' + window.location.hostname);

    socket.on('msg', function (diff) {
      applyDiff(diff, serverDB);
      updateClient();
    });

    socket.on('init', function (db) {
      serverDB = copyObject(db);
      Cheese.db = copyObject(db);
      initialized = true;
      Cheese.reload();
      startup();
      Cheese.reload();
      domLoaded = true;
    });

    socket.on('custom', function (msg) {
      if (Cheese.messageHandlers[msg.msg]) Cheese.messageHandlers[msg.msg](msg.args);
      Cheese.reload();
    });

    Cheese.socket = {
      emit: function (m, d) {
        if (initialized) socket.emit('custom', { msg: m, args: d });
      },
      on: function (m, f) {
        Cheese.messageHandlers[m] = f;
      }
    };
  };

  Cheese.reload = function () {
    updateServer();

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
    initializeEvents();
  };

  Cheese.request = function (name, callback) {
    if (typeof callback === 'function') {
      $.ajax('/__static/' + name, { async: true }).done(callback);
      return undefined;
    }

    var content;
    $.ajax('/__static/' + name, { async: false }).done(function (data) { content = data; });
    return content;
  };

  Cheese.route = function (r, f) {
    this.routes[r] = f;
    if (routeMatchesPattern(r, window.location.pathname)) Cheese.reload();
  };

  Cheese.startup = function (f) {
    startup = f;
  };

  Cheese.event = function (event, selector, handler) {
    if (! this.events[selector]) this.events[selector] = {};
    this.events[selector][event] = function (e) {
      handler(e);
      Cheese.reload();
    };
    if (domLoaded) initializeEvents();
  };
})(jQuery, DOMUtils, diffUtils);

delete window.diffUtils;
delete window.DOMUtils;
delete window.jQuery;
delete window.$;
delete window.io;
