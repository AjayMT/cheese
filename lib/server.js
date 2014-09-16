
/* global module, require */

var http = require('http');
var fs = require('fs');
var path = require('path');

var io = require('socket.io');
var debug = require('debug')('cheese:server');

var diffUtils = require('./diff.js');
var Cheese = require('./main.js');
var serverIO = require('./server-io.js');

var server, port, clientData, staticData;

var serverHandler = function (req, res) {
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
}

var start = function (portArg, clientDataArg, staticDataArg, mainFilePath) {
  if (mainFilePath) Cheese = require(path.resolve(mainFilePath));
  if (Cheese.dbFile)
    fs.writeFileSync(Cheese.dbFile, JSON.stringify(Cheese.db));

  port = portArg;
  clientData = clientDataArg;
  staticData = staticDataArg;

  server = http.createServer(serverHandler);

  server.listen(port, function () {
    debug('cheese HTTP server listening on port ' + port);
  });
  io = io(server);
  debug('socket.io server initialized');

  io.on('connection', function (socket) {
    serverIO.ioHandler(io, socket, Cheese);
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
