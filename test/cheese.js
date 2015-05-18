
/* global describe, before, it, require */

var path = require('path');
var request = require('supertest');
var fs = require('fs');

var cheese = require('..');

var app;

describe('cheese', function () {
  before(function (done) {
    app = cheese(path.join(__dirname, 'client.js'));

    app.listen(3000, done);
  });

  it('should send index.html', function (done) {
    var index = fs.readFileSync(path.join(__dirname, '..', 'index.html'),
                                { encoding: 'utf-8' });

    request(app)
    .get('/')
    .expect(200)
    .expect(index, done);
  });
});
