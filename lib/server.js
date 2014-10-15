
/* global module, require */

// require()s
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');

var io = require('socket.io');
var debug = require('debug')('cheese:server');

var diffUtils = require('./diff.js');
var Cheese = require('./main.js');
var CDP = require('./server-cdp.js');

var server = module.exports = {};

// routeMatchesPattern: check if a route ('route') such as '/foo/abc'
// matches a pattern ('pattern') such as '/:arg/abc'
server.routeMatchesPattern = function (pattern, route) {
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

// argsForRoute: get a list of arguments such as ['foo']
// for a route ('route') such as '/foo/abc' according to a
// pattern ('pattern') such as '/:arg/abc'
server.argsForRoute = function (pattern, route) {
  if (! server.routeMatchesPattern(pattern, route)) return [];

  pattern = pattern.split('/').filter(function (i) { return i !== ''; });
  route = route.split('/').filter(function (i) { return i !== ''; });
  var args = [];

  for (var i = 0; i < pattern.length; i++)
    if (pattern[i].charAt(0) === ':') args.push(route[i]);

  return args;
}

// serverHandler: this is the http request handler used in the server
server.serverHandler = function (req, res) {
  debug(req.method + ' ' + req.url);

  if (req.url === '/__client/client.js') {
    res.writeHead(200, { 'content-type': 'application/javascript' });

    var jQueryPath = path.join(__dirname, '..', 'node_modules', 'jquery', 'dist', 'jquery.min.js');
    var jQueryScript = fs.readFileSync(jQueryPath,
                                       { 'encoding': 'utf-8' }) + '\n';
    var diffScript = fs.readFileSync(path.join(__dirname, 'diff.js'),
                                     { 'encoding': 'utf-8' }) + '\n';
    var DOMScript = fs.readFileSync(path.join(__dirname, 'dom.js'),
                                    { 'encoding': 'utf-8' }) + '\n';
    var body = fs.readFileSync(path.join(__dirname, 'client.js'),
                               { 'encoding': 'utf-8' }) + server.clientData;

    res.end(jQueryScript + diffScript + DOMScript + body);
    return;
  } else if (req.url.indexOf('/__static') !== -1) {
    res.writeHead(200);

    var requestPath = req.url.split('/__static')[1];
    var content;

    for (var r in Cheese.staticData)
      if (server.routeMatchesPattern(r, requestPath)) {
        var args = server.argsForRoute(r, requestPath);
        content = Cheese.staticData[r].apply(new Function(), args);
        break;
      }

    if (content === undefined) {
      if (server.staticData[requestPath]) content = server.staticData[requestPath];
      else content = server.staticData[requestPath.split('/').slice(1).join('/')]
    }

    res.end(content);
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html' });
  var html = fs.readFileSync(path.join(__dirname, 'index.html'), { 'encoding': 'utf-8' });
  res.end(html);
}

// start: start a cheese server listening on port 'portArg', with client javascript 'clientDataArg',
// static data 'staticDataArg', main file 'mainFilePathOrDone' and callback 'done'
server.start = function (portArg, clientDataArg, staticDataArg,
                         mainFilePathOrDone, done) {
  if (typeof mainFilePathOrDone === 'string') Cheese = require(path.resolve(mainFilePathOrDone));
  if (Cheese.dbFile)
    fs.writeFileSync(Cheese.dbFile, JSON.stringify(Cheese.db));

  server.port = portArg;
  server.clientData = clientDataArg;
  server.staticData = staticDataArg;

  if (Cheese.opts.ssl)
    server.serv = https.createServer(Cheese.opts.ssl, server.serverHandler);
  else
    server.serv = http.createServer(server.serverHandler);

  server.serv.listen(server.port, function () {
    debug('cheese HTTP server listening on port ' + server.port);

    if (typeof mainFilePathOrDone === 'function') mainFilePathOrDone();
    else if (done) done();
  });

  io = io(server.serv, Cheese.opts.ssl || {});

  debug('socket.io server initialized');

  io.on('connection', function (socket) {
    CDP.ioHandler(io, socket, Cheese);
  });
};

// kill: kill/stop the currently running server
server.kill = function () {
  debug('killing cheese server on port ' + server.port);
  io.close();
  io = require('socket.io');
};

// reload: reload the server with new client javascript 'clientDataArg',
// new static content 'staticDataArg' and main file 'mainFilePath'
server.reload = function (clientDataArg, staticDataArg, mainFilePath) {
  server.clientData = clientDataArg;
  server.staticData = staticDataArg;

  if (mainFilePath) {
    delete require.cache[require.resolve(path.resolve(mainFilePath))];
    Cheese = require(path.resolve(mainFilePath));
  }

  io.emit('reload');
}
