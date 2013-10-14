var cheeseObject = {};

var createClient = function () {
  var socket = io.connect(document.URL);
  socket.on('msg', function (data) {
    cheeseObject = data;
  });
};

$.getScript('/socket.io/socket.io.js', createClient);

