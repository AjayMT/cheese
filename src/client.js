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
      for (var event in Cheese.events[selector])
        $(selector).off(event).on(event, function (e) {
          Cheese.events[selector][event](e);
          Cheese.reload(false);
        });
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
      Cheese.reload(true);
    });
  };
  
  watch(Cheese, 'db', updateServer, 0, true);
  
  Cheese.reload = function (shouldInitEvents) {
    var html = document.createElement('html');
    html.innerHTML = this.routes[window.location.pathname]();
    DOMUtils.updateDOMElement($('html'), $(html));
    domLoaded = true;
    if (shouldInitEvents) initializeEvents();
  };
  
  Cheese.request = function (name) {
    var content;
    $.ajax('/__static/' + name, { async: false }).done(function (data) { content = data; });
    return content;
  };
  
  Cheese.route = function (r, f) {
    this.routes[r] = f;
    if (window.location.pathname === r && initialized) this.reload();
  };
  
  Cheese.dbLoaded = function (f) {
    dbLoaded = f;
  };
  
  Cheese.event = function (event, selector, handler) {
    if (! this.events[selector]) this.events[selector] = {};
    this.events[selector][event] = handler;
    if (domLoaded)
      $(selector).off(event).on(event, function (e) {
        handler(e);
        Cheese.reload(false);
      });
  };
})(jQuery, DOMUtils, diffUtils);

delete window.diffUtils;
delete window.DOMUtils;
delete window.jQuery;
delete window.$;
delete window.io;
delete window.watch, window.unwatch, window.callWatchers, window.WatchJS;
