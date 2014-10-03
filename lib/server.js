
/* global module, require */

var http = require('http');
var fs = require('fs');
var path = require('path');

var io = require('socket.io');
var debug = require('debug')('cheese:server');

var diffUtils = require('./diff.js');
var Cheese = require('./main.js');
var serverCDP = require('./server-cdp.js');

var server, port, clientData, staticData;

function routeMatchesPattern (pattern, route) {
  pattern = pattern.split('/').filter(function (i) { return i !== ''; });
  route = route.split('/').filter(function (i) { return i !== ''; });

  if (pattern.length !== route.length) return false;

  var args = {};

  for (var i = 0; i < pattern.length; i++)
    if (pattern[i].charAt(0) === ':') args[i] = pattern[i];

  for (var j = 0; j < route.length; j++) {
    if (args[j] === undefined && route[j] !== pattern[j]) return false;
  }

  return true;
}

function argsForRoute (pattern, route) {
  if (! routeMatchesPattern(pattern, route)) return [];

  pattern = pattern.split('/').filter(function (i) { return i !== ''; });
  route = route.split('/').filter(function (i) { return i !== ''; });
  var args = [];

  for (var i = 0; i < pattern.length; i++)
    if (pattern[i].charAt(0) === ':') args.push(route[i]);

  return args;
}

function serverHandler (req, res) {
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

    for (var r in Cheese.staticData)
      if (routeMatchesPattern(r, '/' + requestPath)) {
        var args = argsForRoute(r, '/' + requestPath);
        content = Cheese.staticData[r].apply(new Function(), args);
        break;
      }

    if (content === undefined) content = staticData[requestPath];

    res.end(content);
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html' });
  var html = fs.readFileSync(path.join(__dirname, 'index.html'), { 'encoding': 'utf-8' });
  res.end(html);
}

var start = function (portArg, clientDataArg, staticDataArg, mainFilePathOrDone, done) {
  if (typeof mainFilePathOrDone === 'string') Cheese = require(path.resolve(mainFilePathOrDone));
  if (Cheese.dbFile)
    fs.writeFileSync(Cheese.dbFile, JSON.stringify(Cheese.db));

  port = portArg;
  clientData = clientDataArg;
  staticData = staticDataArg;

  server = http.createServer(serverHandler);

  server.listen(port, function () {
    debug('cheese HTTP server listening on port ' + port);

    if (typeof mainFilePathOrDone === 'function') mainFilePathOrDone();
    else if (done) done();
  });
  io = io(server);
  debug('socket.io server initialized');

  io.on('connection', function (socket) {
    serverCDP.ioHandler(io, socket, Cheese);
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

  if (mainFilePath) {
    delete require.cache[require.resolve(path.resolve(mainFilePath))];
    Cheese = require(path.resolve(mainFilePath));
  }

  io.emit('reload');
}

module.exports = {
  start: start,
  kill: kill,
  reload: reload
};
