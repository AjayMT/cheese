var Cheese = { db: {} };

var func = function (port, clientData) {
  var io = require('socket.io');
  var http = require('http');
  var fs = require('fs');
  var path = require('path');
  
  var server = http.createServer(function (req, res) {
    if (req.url == '/__client/client.js') {
      res.writeHead(200, { 'content-type': 'application/javascript' });
      var body = fs.readFileSync(path.join(__dirname, 'client.js'), { 'encoding': 'utf-8' }) + clientData;
      res.end(body);
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
	console.log(Cheese);
      }
    });
  });
};

module.exports = func;
