
var http = require('http');

window.request = function () {
  http.get({ path: '/foo' }, function (res) {
    res.on('data', function (data) {
      document.write(data.toString());
    });
  });
}

document.write('<button onclick="request()">Request</button>');
