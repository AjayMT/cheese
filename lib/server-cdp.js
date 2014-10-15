
/* global module, require */

// require()s
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

function applyFilters (filters, diff, client) {
  for (var f in filters)
    diff = filters[f](diffUtils.copyObject(diff), client);

  return diffUtils.copyObject(diff);
}

module.exports.ioHandler = function (io, socket, Cheese) {
  debug('client ' + socket.id + ' connected');

  var index = clients.length;
  var diff = diffUtils.copyObject(Cheese.db);

  if (Cheese.filters.all)
    diff = applyFilters(Cheese.filters.all, diff);

  if (Cheese.filters.each)
    diff = applyFilters(Cheese.filters.each, diff, {});

  clients.push(diff);
  sockets.push(socket);

  var sock = defineSock(socket, io);
  sock.update = updateClients;

  if (Cheese.connectHandler) {
    Cheese.connectHandler(sock, socket.id);

    diff = diffUtils.copyObject(Cheese.db);

    if (Cheese.filters.all)
      diff = applyFilters(Cheese.filters.all, diff);

    if (Cheese.filters.each)
      diff = applyFilters(Cheese.filters.each, diff, {});

    clients[index] = diff;
    updateClients();
  }

  debug('initializing client ' + socket.id);
  socket.emit('init', clients[index]);

  function updateServer (diff) {
    if (Cheese.filters.all && (! Cheese.filters.each))
      socket.broadcast.emit('msg', applyFilters(Cheese.filters.all,
                                                diffUtils.copyObject(diff)));
    else if (Cheese.filters.each)
      for (var i in clients) {
        if (i === index) continue;

        var finalDiff = diffUtils.copyObject(diff);

        if (Cheese.filters.all)
          finalDiff = applyFilters(Cheese.filters.all,
                                   diffUtils.copyObject(finalDiff));

        sockets[i].emit('msg', applyFilters(Cheese.filters.each,
                                            diffUtils.copyObject(finalDiff),
                                            clients[i]));
      }

    if (Cheese.opts['db file path'])
      fs.writeFileSync(Cheese.opts['db file path'], JSON.stringify(Cheese.db));

    for (var j in clients) {
      diffUtils.applyDiff(clients[j], applyFilters(Cheese.filters.all,
                                                   diffUtils.copyObject(diff)));
      diffUtils.applyDiff(clients[j], applyFilters(Cheese.filters.each,
                                                   diffUtils.copyObject(diff),
                                                   clients[j]));
    }
  }

  function updateClients (client) {
    if (client === undefined) client = clients[index];

    if (JSON.stringify(diffUtils.createDiff(client, Cheese.db)) === '{}') return;

    if (! Cheese.opts['synchronize db']) return;

    var diff = diffUtils.createDiff(client, Cheese.db);

    if (Cheese.filters.all && (! Cheese.filters.each))
      io.emit('msg', applyFilters(Cheese.filters.all, diffUtils.copyObject(diff)));
    else if (Cheese.filters.each)
      for (var i in clients) {
        diff = diffUtils.createDiff(clients[i], Cheese.db);

        if (Cheese.filters.all)
          diff = applyFilters(Cheese.filters.all, diffUtils.copyObject(diff));

        sockets[i].emit('msg', applyFilters(Cheese.filters.each,
                                            diffUtils.copyObject(diff),
                                            clients[i]));
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
