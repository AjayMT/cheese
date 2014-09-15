
/* global module, require */

var http = require('http');
var fs = require('fs');
var path = require('path');

var io = require('socket.io');
var debug = require('debug')('cheese:server');

var diffUtils = require('./diff.js');
var Cheese = require('./main.js');

var server, port, clientData, staticData;

var start = function (portArg, clientDataArg, staticDataArg, mainFilePath) {
  if (mainFilePath) Cheese = require(path.resolve(mainFilePath));
  if (Cheese.dbFile)
    fs.writeFileSync(Cheese.dbFile, JSON.stringify(Cheese.db));

  port = portArg;
  clientData = clientDataArg;
  staticData = staticDataArg;

  server = http.createServer(function (req, res) {
    debug(req.method + ' ' + req.url);

    if (req.url === '/__client/client.js') {
      res.writeHead(200, { 'content-type': 'application/javascript' });

      var jQueryScript = fs.readFileSync(path.join(__dirname, 'jquery-1.10.2.min.js'), { 'encoding': 'utf-8' }) + '\n';
      var diffScript = fs.readFileSync(path.join(__dirname, 'diff.js'), { 'encoding': 'utf-8' }) + '\n';
      var DOMScript = fs.readFileSync(path.join(__dirname, 'dom.js'), { 'encoding': 'utf-8' }) + '\n';
      var body = fs.readFileSync(path.join(__dirname, 'client.js'), { 'encoding': 'utf-8' }) + clientData;

      res.end(jQueryScript + diffScript + DOMScript + body);
      return;
    } else if (req.url.indexOf('/__static') !== -1) {
      res.writeHead(200);

      var requestPath = req.url.split('/').splice(2).join('/');
      var content;

      if (Cheese.staticData[requestPath]) content = Cheese.staticData[requestPath]();
      else content = staticData[requestPath];

      res.end(content);
      return;
    }

    res.writeHead(200, { 'content-type': 'text/html' });
    var html = fs.readFileSync(path.join(__dirname, 'index.html'), { 'encoding': 'utf-8' });
    res.end(html);
  });

  server.listen(port, function () {
    debug('cheese HTTP server listening on port ' + port);
  });
  io = io(server);
  debug('socket.io server initialized');

  var clients = [];
  var sockets = [];
  var sock = {};

  io.on('connection', function (socket) {
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
  });
};

var kill = function () {
  debug('killing cheese server on port ' + port);
  io.close();
  io = require('socket.io');
};

var reload = function (clientDataArg, staticDataArg, mainFilePath) {
  clientData = clientDataArg;
  staticData = staticDataArg;

  if (mainFilePath) Cheese = require(path.resolve(mainFilePath));

  io.emit('reload');
}

module.exports = {
  start: start,
  kill: kill,
  reload: reload
};
