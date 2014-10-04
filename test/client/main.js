
/* global require, module */

var Cheese = require('../../lib/main.js');

Cheese
.connected(function (sock) {
  Cheese.allow(function (diff) {
    if (diff.hello === 'world') sock.emit('synchronized');

    return true;
  });
})
.on('hello', function (data, sock) {
  sock.emit('world');
});

module.exports = Cheese;

