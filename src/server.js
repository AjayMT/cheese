var io = require('socket.io');
var http = require('http');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var diffUtils = require('./diff.js');
var WatchJS = require('./watch.min.js');
var Cheese = require('./main.js');

var func = function (port, clientData, staticData, mainFilePath) {
  if (mainFilePath) Cheese = require(path.resolve(mainFilePath));
  
  var server = http.createServer(function (req, res) {
    if (req.url === '/__client/client.js') {
      res.writeHead(200, { 'content-type': 'application/javascript' });
      var body = fs.readFileSync(path.join(__dirname, 'client.js'), { 'encoding': 'utf-8' }) + clientData;
      var diffScript = fs.readFileSync(path.join(__dirname, 'diff.js'), { 'encoding': 'utf-8' }) + '\n';
      var DOMScript = fs.readFileSync(path.join(__dirname, 'dom.js'), { 'encoding': 'utf-8' }) + '\n';
      res.end(diffScript + DOMScript + body);
      return;
    } else if (req.url === '/__client/watch.min.js') {
      res.writeHead(200, { 'content-type': 'application/javascript' });
      var watchScript = fs.readFileSync(path.join(__dirname, 'watch.min.js'), { 'encoding': 'utf-8' });
      res.end(watchScript);
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
  server.listen(port);
  io = io.listen(server);
  
  io.sockets.on('connection', function (socket) {
    var clientDB = Cheese.db;
    
    socket.emit('msg', clientDB);
    socket.on('msg', function (diff) {
      diffUtils.applyDiff(diff, clientDB);
    });
    
    WatchJS.watch(clientDB, function () {
      diffUtils.applyDiff(diffUtils.createDiff(Cheese.db, clientDB), Cheese.db);
    }, 0, true);
    
    WatchJS.watch(Cheese, 'db', function () {
      if (Cheese.db !== clientDB) {
        socket.emit('msg', diffUtils.createDiff(clientDB, Cheese.db));
        diffUtils.applyDiff(diffUtils.createDiff(clientDB, Cheese.db), clientDB);
      }
    }, 0, true);
  });
};

module.exports = func;
