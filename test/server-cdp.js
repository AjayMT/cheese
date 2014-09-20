
/* global require, describe, before, after, it */

var path = require('path');

var io = require('socket.io-client');
var should = require('should');

describe('server-cdp', function () {
  var server = require('../lib/server.js');

  before(function (done) {
    server.start(3000, '', {}, done);
  });

  it('should send init message on connection', function (done) {
    var socket = io('http://localhost:3000', { forceNew: true });
    socket.on('connect', function () {
      socket.on('init', function () { done(); });
    });
  });

  it('should send diffs to other clients', function (done) {
    var s1 = io('http://localhost:3000', { forceNew: true });
    var s2 = io('http://localhost:3000', { forceNew: true });

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

  describe('#filter(), #allow()', function () {
    before(function () {
      server.reload('', {}, path.join(__dirname, 'app', 'main.js'));
    });

    it('should not send filtered properties to clients', function (done) {
      var sock = io('http://localhost:3000', { forceNew: true });

      sock.on('connect', function () {
        sock.on('init', function (data) {
          data.should.not.have.property('password');
          done();
        });
      });
    });

    it('should not allow clients to change some properties', function (done) {
      var sock = io('http://localhost:3000', { forceNew: true });

      sock.on('connect', function () {
        sock.on('init', function (data) {
          sock.emit('msg', { users: { 0: { password: 'abcxyz' } } });
        });

        sock.on('msg', function (data) {
          data.users[0].should.have.property('password', null);
          done();
        });
      });
    });
  });

  after(server.kill);
});