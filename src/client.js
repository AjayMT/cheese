var Cheese = { routes: {} };

$.getScript('/socket.io/socket.io.js', function () {
  var socket = io.connect(document.URL);
  socket.on('msg', function (data) {
    for (k in data) {
      Cheese[k] = data[k];
    }
  });
  
  Cheese.reload = function () {
    $('body')[0].innerHTML = Cheese.routes['/']();
  };
});
