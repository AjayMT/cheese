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
      $('body').html(Cheese.routes['/']());
    };
    
    Cheese.route = function (r, f) {
      Cheese.routes[r] = f;
      if (window.location.pathname === r) Cheese.reload();
    };
  };
})(jQuery);

jQuery = undefined;
$ = undefined;
