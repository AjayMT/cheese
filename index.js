
/* global require, module */

var fs = require('fs');
var path = require('path');
var express = require('express');
var browserify = require('browserify');

function cheese (client) {
  var app = express();
  var b = browserify(client);

  app.use('/', express.static(path.join(__dirname, 'index.html')));

  app.get('/__client', function (req, res) {
    b.bundle().pipe(res);
  });

  return app;
}

module.exports = cheese;
