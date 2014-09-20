
var Cheese = require('../../lib/main.js');

Cheese.on('hello', function (data, sock) {
  sock.emit('world');
});

module.exports = Cheese;
