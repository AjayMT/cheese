var io = require('socket.io');
var http = require('http');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var diffUtils = require('./diff.js');
var WatchJS = require('./watch.min.js');
var Cheese = require('./main.js');

function configureSocketIO () {
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
  io.set('log level', 1);
  io.set('transports', ['websocket',
                        'htmlfile',
                        'xhr-polling',
                        'jsonp-polling']);
}

var func = function (port, clientData, staticData, mainFilePath) {
  if (mainFilePath) Cheese = require(path.resolve(mainFilePath));
  if (Cheese.dbFile)
    fs.writeFileSync(Cheese.dbFile, JSON.stringify(Cheese.db));
  
  var server = http.createServer(function (req, res) {
    if (req.url === '/__client/client.js') {
      res.writeHead(200, { 'content-type': 'application/javascript' });
      var body = fs.readFileSync(path.join(__dirname, 'client.js'), { 'encoding': 'utf-8' }) + clientData;
      var diffScript = fs.readFileSync(path.join(__dirname, 'diff.js'), { 'encoding': 'utf-8' }) + '\n';
      var DOMScript = fs.readFileSync(path.join(__dirname, 'dom.js'), { 'encoding': 'utf-8' }) + '\n';
      var jQueryScript = fs.readFileSync(path.join(__dirname, 'jquery-1.10.2.min.js'), { 'encoding': 'utf-8' }) + '\n';
      res.end(jQueryScript + diffScript + DOMScript + body);
      return;
    }  else if (req.url.indexOf('/__static') !== -1) {
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
  
  configureSocketIO();
  
  var clients = [];
  
  io.sockets.on('connection', function (socket) {
    var index = clients.length;
    clients.push(diffUtils.copyObject(Cheese.db));
    
    function updateServer () {
      socket.broadcast.emit('msg', diffUtils.createDiff(Cheese.db, clients[index]));
      Cheese.db = diffUtils.copyObject(clients[index]);
      
      if (Cheese.dbFile) fs.writeFileSync(Cheese.dbFile, JSON.stringify(Cheese.db));
      
      for (var i = 0; i < clients.length; i++)
        clients[i] = diffUtils.copyObject(Cheese.db);
    }
    
    socket.emit('init', clients[index]);
    
    socket.on('msg', function (diff) {
      diffUtils.applyDiff(diff, clients[index]);
      updateServer();
    });
    
    socket.on('disconnect', function () {
      clients.splice(index, 1);
    });
  });
};

module.exports = func;
