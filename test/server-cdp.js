
/* global require, describe, before, after, it */

var fs = require('fs');
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
      server.reload('', {}, path.join(__dirname, 'main-files', 'filter-allow.js'));
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

  describe('#set()', function () {
    before(function () {
      server.reload('', {}, path.join(__dirname, 'main-files', 'set.js'));
    });

    it('should not send diffs', function (done) {
      var sock = io('http://localhost:3000', { forceNew: true });

      sock.on('connect', function () {
        sock.on('init', function (data) {
          sock.emit('msg', { hello: 'world' });
          done();
        });

        sock.on('msg', function () {
          throw new Error('Server sent diff');
        });
      });
    });

    it('should save the db', function (done) {
      fs.readFile(path.join(__dirname, 'main-files', 'db.json'),
                  { encoding: 'utf-8' },
                  function (err, data) {
                    var db = JSON.parse(data);
                    db.should.have.property('hello', 'world');
                    done(err);
                  });
    });

    after(function (done) {
      fs.unlink(path.join(__dirname, 'main-files', 'db.json'), done);
    });
  });

  describe('messages', function () {
    before(function () {
      server.reload('', {}, path.join(__dirname, 'main-files', 'messages.js'));
    });

    it('should send & receive messages', function (done) {
      var sock = io('http://localhost:3000', { forceNew: true });

      sock.on('connect', function () {
        sock.emit('custom', { msg: 'hello', args: {} });

        sock.on('custom', function (data) {
          data.should.have.property('msg', 'world');
          done();
        });
      });
    });
  });

  after(server.kill);
});
