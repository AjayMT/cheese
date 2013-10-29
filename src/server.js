var Cheese = { db: {} };

var func = function (port, clientData, staticData) {
  var io = require('socket.io');
  var http = require('http');
  var fs = require('fs');
  var path = require('path');
  var _ = require('underscore');
  
  var server = http.createServer(function (req, res) {
    if (req.url == '/__client/client.js') {
      res.writeHead(200, { 'content-type': 'application/javascript' });
      var body = fs.readFileSync(path.join(__dirname, 'client.js'), { 'encoding': 'utf-8' }) + clientData;
      res.end(body);
      return;
    } else if (req.url.indexOf('/__static') !== -1) {
      res.writeHead(200);
      res.end(staticData[req.url.split('/').splice(2).join('/')]);
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    var html = fs.readFileSync(path.join(__dirname, 'index.html'), { 'encoding': 'utf-8' });
    res.end(html);
  });
  server.listen(port);
  io = io.listen(server);
  
  io.sockets.on('connection', function (socket) {
    socket.emit('msg', Cheese);
    socket.on('msg', function (data) {
      for (var k in data) {
        Cheese[k] = data[k];
      }
    });
  });
};

module.exports = func;
