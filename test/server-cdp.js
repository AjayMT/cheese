
/* global require, describe, before, after, it */

var io = require('socket.io-client');
var should = require('should');

describe('server-cdp', function () {
  var server = require('../lib/server.js');

  before(function (done) {
    server.start(3000, '', {}, done);
  });

  it('should send init message on connection', function (done) {
    var socket = io('http://localhost:3000', { 'force new connection': true });
    socket.on('connect', function () {
      socket.on('init', function () { done(); });
    });
  });

  it('should send diffs to other clients', function (done) {
    var s1 = io('http://localhost:3000', { 'force new connection': true });
    var s2 = io('http://localhost:3000', { 'force new connection': true });

    s1.on('connect', function () {
      s1.on('init', function () {
        s1.emit('msg', { hello: 'world' });
      });
    });

    s2.on('connect', function () {
      s2.on('msg', function (data) {
        data.should.have.property('hello', 'world');
        done();
      });
    });
  });

  after(server.kill);
});
