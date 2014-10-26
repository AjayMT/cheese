
/* global module, require */

// require()s
var fs = require('fs');

var debug = require('debug')('cheese:socket');
var BSON = require('buffalo');
var diffUtils = require('cdp-diff');

var CDP = module.exports = {
  clients: [],
  sockets: []
};

CDP.defineSock = function (socket, io) {
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

CDP.allowDiff = function (rules, diff, client) {
  diff = diffUtils.copyObject(diff);
  client = diffUtils.copyObject(client);

  for (var a in rules)
    if (! rules[a](diff, client)) return false;

  return true;
}

CDP.applyFilters = function (filters, diff, client) {
  diff = diffUtils.copyObject(diff);
  client = diffUtils.copyObject(client);

  for (var f in filters)
    diff = filters[f](diff, client);

  return diffUtils.copyObject(diff);
}

CDP.ioHandler = function (io, socket, Cheese) {
  debug('client ' + socket.id + ' connected');

  var index = CDP.clients.length;
  var clientDB = diffUtils.copyObject(Cheese.db);

  if (Cheese.filters.all.length > 0)
    clientDB = CDP.applyFilters(Cheese.filters.all, clientDB);

  if (Cheese.filters.each.length > 0)
    clientDB = CDP.applyFilters(Cheese.filters.each, clientDB, {});

  CDP.clients.push(clientDB);
  CDP.sockets.push(socket);

  var sock = CDP.defineSock(socket, io);
  sock.update = updateClients;

  Cheese.emit('connect', sock, socket.id);

  clientDB = diffUtils.copyObject(Cheese.db);

  if (Cheese.filters.all.length > 0)
    clientDB = CDP.applyFilters(Cheese.filters.all, clientDB);

  if (Cheese.filters.each.length > 0)
    clientDB = CDP.applyFilters(Cheese.filters.each, clientDB, {});

  CDP.clients[index] = diffUtils.copyObject(clientDB);

  if (Cheese._events.connect)
    updateClients();

  debug('initializing client ' + socket.id);
  socket.emit('init', CDP.clients[index]);

  function updateServer (diff) {
    if (Cheese.filters.all.length > 0 && (! Cheese.filters.each.length > 0))
      socket.broadcast.emit('msg', CDP.applyFilters(Cheese.filters.all,
                                                    diffUtils.copyObject(diff)));
    else if (Cheese.filters.each.length > 0)
      for (var i in CDP.clients) {
        if (i === index) continue;

        var finalDiff = diffUtils.copyObject(diff);

        if (Cheese.filters.all.length > 0)
          finalDiff = CDP.applyFilters(Cheese.filters.all,
                                       diffUtils.copyObject(finalDiff));

        CDP.sockets[i].emit('msg', CDP.applyFilters(Cheese.filters.each,
                                                    diffUtils.copyObject(finalDiff),
                                                    CDP.clients[i]));
      }

    if (Cheese.opts['db file path'])
      fs.writeFileSync(Cheese.opts['db file path'], BSON.serialize(Cheese.db));

    for (var j in CDP.clients) {
      diffUtils.applyDiff(CDP.clients[j], CDP.applyFilters(Cheese.filters.all,
                                                           diffUtils.copyObject(diff)));
      diffUtils.applyDiff(CDP.clients[j], CDP.applyFilters(Cheese.filters.each,
                                                           diffUtils.copyObject(diff),
                                                           CDP.clients[j]));
    }
  }

  function updateClients (client) {
    if (client === undefined) client = CDP.clients[index];

    if (JSON.stringify(diffUtils.createDiff(client, Cheese.db)) === '{}')
      return;

    if (! Cheese.opts['synchronize db']) return;

    var diff = diffUtils.createDiff(client, Cheese.db);

    if (Cheese.filters.all.length > 0 && (! Cheese.filters.each.length > 0))
      io.emit('msg', CDP.applyFilters(Cheese.filters.all, diffUtils.copyObject(diff)));
    else if (Cheese.filters.each.length > 0)
      for (var i in CDP.clients) {
        diff = diffUtils.createDiff(CDP.clients[i], Cheese.db);

        if (Cheese.filters.all.length > 0)
          diff = CDP.applyFilters(Cheese.filters.all, diffUtils.copyObject(diff));

        CDP.sockets[i].emit('msg', CDP.applyFilters(Cheese.filters.each,
                                                    diffUtils.copyObject(diff),
                                                    CDP.clients[i]));
      }
  }

  socket.on('custom', function (msg) {
    debug('received message ' + JSON.stringify(msg) + ' from client ' + socket.id);

    Cheese.emit(msg.msg, msg.args, sock,
                CDP.clients[index], socket.id);
    updateClients();
  });

  socket.on('msg', function (diff) {
    debug('client ' + socket.id + ' sent diff ' + JSON.stringify(diff));

    if (! Cheese.opts['synchronize db']) return;

    if (! CDP.allowDiff(Cheese.allows,
                        diffUtils.copyObject(diff),
                        diffUtils.copyObject(CDP.clients[index]))) {
      var newDiff = diffUtils.revertDiff(diff, diffUtils.copyObject(CDP.clients[index]));

      socket.emit('msg', newDiff);
      return;
    }

    diffUtils.applyDiff(diff, Cheese.db);
    diffUtils.applyDiff(diff, CDP.clients[index]);
    updateServer(diff);
  });

  socket.on('disconnect', function () {
    debug('client ' + socket.id + ' disconnected');

    Cheese.emit('disconnect', sock, socket.id);

    CDP.clients.splice(index, 1);
    CDP.sockets.splice(index, 1);

    for (var k in CDP.clients) updateClients(CDP.clients[k]);
  });
}
