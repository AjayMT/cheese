var Cheese = { routes: {}, db: {}, events: {} };

(function ($, DOM, diff) {
  var applyDiff = diff.applyDiff;
  var createDiff = diff.createDiff;
  var DOMUtils = DOM;
  
  $.ajax('/socket.io/socket.io.js', { async: false }).done(handleMessages);
  
  var serverDB = {};
  var socket;
  var isApplyingDiff = false;
  var initialized = false;
  var dbLoaded = function () {};
  var domLoaded = false;
  
  function updateClient () {
    isApplyingDiff = true;
    applyDiff(createDiff(Cheese.db, serverDB), Cheese.db);
    isApplyingDiff = false;
    Cheese.reload();
  }
  
  function updateServer () {
    if (isApplyingDiff || ! initialized) return;
    
    socket.emit('msg', createDiff(serverDB, Cheese.db));
    applyDiff(createDiff(serverDB, Cheese.db), serverDB);
    Cheese.reload();
  };
  
  function initializeEvents () {
    for (var selector in Cheese.events)
      $(selector).off(Cheese.events[selector]).on(Cheese.events[selector]);
  }
  
  function handleMessages () {
    socket = io.connect('http://' + window.location.hostname);
    
    socket.on('msg', function (diff) {
      applyDiff(diff, serverDB);
      updateClient();
    });
    
    socket.on('init', function (db) {
      serverDB = db;
      Cheese.db = db;
      initialized = true;
      dbLoaded();
      Cheese.reload();
      domLoaded = true;
    });
  };
  
  watch(Cheese, 'db', updateServer, 0, true);
  
  Cheese.reload = function () {
    var html = document.createElement('html');
    html.innerHTML = this.routes[window.location.pathname]();
    DOMUtils.updateDOMElement($('html'), $(html));
    initializeEvents();
  };
  
  Cheese.request = function (name) {
    var content;
    $.ajax('/__static/' + name, { async: false }).done(function (data) { content = data; });
    return content;
  };
  
  Cheese.route = function (r, f) {
    this.routes[r] = f;
  };
  
  Cheese.dbLoaded = function (f) {
    dbLoaded = f;
  };
  
  Cheese.event = function (event, selector, handler) {
    if (! this.events[selector]) this.events[selector] = {};
    this.events[selector][event] = handler;
    if (domLoaded) initializeEvents();
  };
})(jQuery, DOMUtils, diffUtils);

delete window.diffUtils;
delete window.DOMUtils;
delete window.jQuery;
delete window.$;
delete window.io;
delete window.watch, window.unwatch, window.callWatchers, window.WatchJS;
