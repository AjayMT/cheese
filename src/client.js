var Cheese = { routes: {} };

(function ($) {
  $.ajax('/socket.io/socket.io.js', { async: false }).done(onComplete);
  
  function onComplete () {
    var socket = io.connect(document.URL);
    socket.on('msg', function (data) {
      for (var k in data) {
        Cheese[k] = data[k];
      }
    });
    
    Cheese.reload = function () {
      $('html').html(Cheese.routes[window.location.pathname]());
    };
    
    Cheese.request = function (name) {
      var content;
      $.ajax('/__static/' + name, { async: false }).done(function (data) { content = data; });
      return content;
    };
    
    Cheese.route = function (r, f) {
      Cheese.routes[r] = f;
      if (window.location.pathname === r) Cheese.reload();
    };
  };
})(jQuery);

jQuery = undefined;
$ = undefined;
