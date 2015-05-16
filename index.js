
var fs = require('fs');
var path = require('path');
var express = require('express');
var browserify = require('browserify');

function cheese (client) {
  var app = express();
  var b = browserify(client);

  app.get('/', function (req, res) {
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  });

  app.get('/__client', function (req, res) {
    b.bundle().pipe(res);
  });

  return app;
}

module.exports = cheese;
