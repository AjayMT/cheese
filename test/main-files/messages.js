
var Cheese = require('../../lib/main.js');

Cheese
.connected(function (sock, id) {
  sock.emit('successful connection', { id: id });
})
.disconnected(function (sock, id) {
  sock.emitOthers('client disconnected', { id: id });
})
.on('hello', function (data, sock) {
  sock.emit('world');
});

module.exports = Cheese;
