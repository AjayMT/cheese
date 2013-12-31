
var Cheese = { routes: {}, db: {}, events: {} };

(function ($, DOM, diff) {
  var applyDiff = diff.applyDiff;
  var createDiff = diff.createDiff;
  var copyObject = diff.copyObject;
  var DOMUtils = DOM;
  
  $.ajax('/socket.io/socket.io.js', { async: false }).done(handleMessages);
  
  var serverDB = {};
  var socket;
  var initialized = false;
  var dbLoaded = function () {};
  var domLoaded = false;
  
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
    socket = io.connect('http://' + window.location.hostname);
    
    socket.on('msg', function (diff) {
      applyDiff(diff, serverDB);
      updateClient();
    });
    
    socket.on('init', function (db) {
      serverDB = copyObject(db);
      Cheese.db = copyObject(db);
      initialized = true;
      dbLoaded();
      Cheese.reload();
      domLoaded = true;
    });
  };
  
  Cheese.reload = function () {
    updateServer();
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
