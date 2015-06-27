
var path = require('path');
var express = require('express');
var cheese = require('..');

var app = express();

app.get('/foo', function (req, res) {
  res.send('hello');
});

app.use('/', cheese(path.join(__dirname, 'client.js')));

app.listen(3000);
