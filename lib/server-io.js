
/* global module, require */

var fs = require('fs');

var debug = require('debug')('cheese:socket');
var diffUtils = require('./diff.js');

var clients = module.exports.clients = [];
var sockets = module.exports.sockets = [];
var sock = {};

module.exports.ioHandler = function (io, socket, Cheese) {
  debug('client ' + socket.id + ' connected');

  if (Cheese.connectHandler) {
    Cheese.connectHandler(sock);
    clients[index] = Cheese.filterInfo.func(diffUtils.copyObject(Cheese.db), {});
    updateClients();
  }

  var index = clients.length;
  clients.push(Cheese.filterInfo.func(diffUtils.copyObject(Cheese.db), {}));
  sockets.push(socket);

  function updateServer (diff) {
    if (! Cheese.filterInfo.each)
      socket.broadcast.emit('msg',
                            Cheese.filterInfo.func(diffUtils.copyObject(diff)));
    else {
      for (var i = 0; i < clients.length; i++) {
        if (i === index) continue;

        sockets[i].emit(Cheese.filterInfo.func(diffUtils.copyObject(diff),
                                               diffUtils.copyObject(clients[i])));
      }
    }

    if (Cheese.dbFilePath)
      fs.writeFileSync(Cheese.dbFilePath, JSON.stringify(Cheese.db));

    for (var i = 0; i < clients.length; i++)
      diffUtils.applyDiff(clients[i],
                          Cheese.filterInfo.func(diffUtils.copyObject(diff),
                                                 diffUtils.copyObject(clients[i])));
  }

  function updateClients () {
    if (JSON.stringify(diffUtils.createDiff(clients[index], Cheese.db)) === '{}') return;

    if (! Cheese.filterInfo.each) {
      var diff = diffUtils.createDiff(clients[index], Cheese.db);
      io.emit('msg', Cheese.filterInfo.func(diffUtils.copyObject(diff)));
    } else {
      for (var i = 0; i < clients.length; i++) {
        var diff = diffUtils.createDiff(clients[i], Cheese.db);
        sockets[i].emit('msg',
                        Cheese.filterInfo.func(diffUtils.copyObject(diff),
                                               diffUtils.copyObject(clients[i])));
      }
    }
  }

  sock.update = updateClients;
  sock.emit = function (m, d) {
    debug('sent message ' + JSON.stringify(m) + ' to client ' + socket.id);
    socket.emit('custom', { msg: m, args: d });
  };
  sock.emitOthers = function (m, d) {
    debug('sent message ' + JSON.stringify(m) + ' to clients other than ' + socket.id);
    socket.broadcast.emit('custom', { msg: m, args: d });
  };
  sock.emitAll = function (m, d) {
    debug('sent message ' + JSON.stringify(m) + ' to all clients');
    io.emit('custom', { msg: m, args: d });
  };

  debug('initializing client ' + socket.id);
  socket.emit('init', clients[index]);

  socket.on('custom', function (msg) {
    debug('received message ' + JSON.stringify(msg) + ' from client ' + socket.id);

    if (Cheese.messageHandlers[msg.msg]) {
      Cheese.messageHandlers[msg.msg](msg.args, sock, clients[index]);
      updateClients();
    }
  });

  socket.on('msg', function (diff) {
    debug('client ' + socket.id + ' sent diff ' + JSON.stringify(diff));

    diffUtils.applyDiff(diff, Cheese.db);
    diffUtils.applyDiff(diff, clients[index]);
    updateServer(diff);
  });

  socket.on('disconnect', function () {
    debug('client ' + socket.id + ' disconnected');

    if (Cheese.disconnectHandler) {
      Cheese.disconnectHandler(sock, clients[index]);
      updateClients();
    }

    clients.splice(index, 1);
    sockets.splice(index, 1);
  });
}
