
/* global describe, before, it, require */

var path = require('path');
var fs = require('fs');
var request = require('supertest');
var express = require('express');

var cheese = require('..');

var app;

describe('cheese', function () {
  before(function (done) {
    app = express();

    app.use('/', cheese(path.join(__dirname, 'client.js')));

    app.listen(3000, done);
  });

  it('should send index.html', function (done) {
    var index = fs.readFileSync(path.join(__dirname, '..', 'index.html'));

    request(app)
    .get('/')
    .expect(200)
    .expect(index.toString(), done);
  });

  it('should send client.js', function (done) {
    var client = fs.readFileSync(path.join(__dirname, 'client.js'));

    request(app)
    .get('/__client')
    .expect(200)
    .expect(function (res) {
      return ! (client.toString() in res.body);
    })
    .end(done);
  });
});
