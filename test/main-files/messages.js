
/* global require, module */

var Cheese = require('../../lib/main.js');

Cheese
.on({
  connect: function (sock, id) {
    sock.emit('successful connection', { id: id });
  },
  disconnect: function (sock, id) {
    sock.emitOthers('client disconnected', { id: id });
  },
  hello: function (data, sock) {
    sock.emit('world');
  }
});

module.exports = Cheese;
