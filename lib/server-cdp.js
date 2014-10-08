
/* global module, require */

var fs = require('fs');

var debug = require('debug')('cheese:socket');
var diffUtils = require('./diff.js');

var clients = module.exports.clients = [];
var sockets = module.exports.sockets = [];

function defineSock (socket, io) {
  var sock = {};

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

  return sock;
}

module.exports.ioHandler = function (io, socket, Cheese) {
  debug('client ' + socket.id + ' connected');

  var index = clients.length;
  clients.push(Cheese.filterInfo.func(diffUtils.copyObject(Cheese.db), {}));
  sockets.push(socket);

  var sock = defineSock(socket, io);
  sock.update = updateClients;

  if (Cheese.connectHandler) {
    Cheese.connectHandler(sock, socket.id);
    clients[index] = Cheese.filterInfo.func(diffUtils.copyObject(Cheese.db), {});
    updateClients();
  }

  debug('initializing client ' + socket.id);
  socket.emit('init', clients[index]);

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

    if (Cheese.opts['db file path'])
      fs.writeFileSync(Cheese.opts['db file path'], JSON.stringify(Cheese.db));

    for (var j = 0; i < clients.length; i++)
      diffUtils.applyDiff(clients[i],
                          Cheese.filterInfo.func(diffUtils.copyObject(diff),
                                                 diffUtils.copyObject(clients[i])));
  }

  function updateClients (client) {
    if (client === undefined) client = clients[index];

    if (JSON.stringify(diffUtils.createDiff(client, Cheese.db)) === '{}') return;

    if (! Cheese.opts['synchronize db']) return;

    if (! Cheese.filterInfo.each) {
      var globalDiff = diffUtils.createDiff(client, Cheese.db);
      io.emit('msg', Cheese.filterInfo.func(diffUtils.copyObject(globalDiff)));
    } else {
      for (var i = 0; i < clients.length; i++) {
        var diff = diffUtils.createDiff(clients[i], Cheese.db);
        sockets[i].emit('msg',
                        Cheese.filterInfo.func(diffUtils.copyObject(diff),
                                               diffUtils.copyObject(clients[i])));
      }
    }
  }

  socket.on('custom', function (msg) {
    debug('received message ' + JSON.stringify(msg) + ' from client ' + socket.id);

    if (Cheese.messageHandlers[msg.msg]) {
      Cheese.messageHandlers[msg.msg](msg.args, sock, clients[index], socket.id);
      updateClients();
    }
  });

  socket.on('msg', function (diff) {
    debug('client ' + socket.id + ' sent diff ' + JSON.stringify(diff));

    if (! Cheese.opts['synchronize db']) return;

    if (! Cheese.allowFunc(diffUtils.copyObject(diff),
                           diffUtils.copyObject(clients[index]))) {
      var clientDB = diffUtils.copyObject(clients[index]);
      diffUtils.applyDiff(diff, clientDB);
      var newDiff = diffUtils.createDiff(clientDB, clients[index]);

      socket.emit('msg', newDiff);
      return;
    }

    diffUtils.applyDiff(diff, Cheese.db);
    diffUtils.applyDiff(diff, clients[index]);
    updateServer(diff);
  });

  socket.on('disconnect', function () {
    debug('client ' + socket.id + ' disconnected');

    if (Cheese.disconnectHandler)
      Cheese.disconnectHandler(sock, socket.id);

    clients.splice(index, 1);
    sockets.splice(index, 1);

    for (var k in clients) updateClients(clients[k]);
  });
}
