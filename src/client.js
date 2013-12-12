var Cheese = { routes: {}, db: {} };

(function ($) {
  var applyDiff = diffUtils.applyDiff;
  var createDiff = diffUtils.createDiff;
  
  $.ajax('/socket.io/socket.io.js', { async: false }).done(handleMessages);
  $.ajax('/__client/watch.min.js', { async: false }).done(setupWatches);
  
  var serverDB = {};
  var socket;
  
  function setupWatches () {
    watch(serverDB, function () {
      if (Cheese.db !== serverDB) applyDiff(createDiff(Cheese.db, serverDB), Cheese.db);
    }, 0, true);
    
    watch(Cheese, 'db', function () {
      if (Cheese.db !== serverDB) {
        socket.emit('msg', createDiff(serverDB, Cheese.db));
        applyDiff(createDiff(serverDB, Cheese.db), serverDB);
      }
      Cheese.reload();
    }, 0, true);
  }
  
  function handleMessages () {
    socket = io.connect('http://' + window.location.hostname);
    socket.on('msg', function (diff) {
      applyDiff(diff, serverDB);
    });
  };
  
  Cheese.reload = function () {
    var html = document.createElement('html');
    html.innerHTML = this.routes[window.location.pathname]();
    DOMUtils.updateDOMElement($('html')[0], html);
  };
  
  Cheese.request = function (name) {
    var content;
    $.ajax('/__static/' + name, { async: false }).done(function (data) { content = data; });
    return content;
  };
  
  Cheese.route = function (r, f) {
    this.routes[r] = f;
    if (window.location.pathname === r) this.reload();
  };
})(jQuery);

diffUtils = undefined;
delete window.diffUtils;
// DOMUtils = undefined;
// delete window.DOMUtils;
// delete window.jQuery;
// delete window.$;
delete window.io;
delete window.watch, window.unwatch, window.callWatchers, window.WatchJS;
