
/* global require, describe, it, before, after */

var should = require('should');
var request = require('supertest');

describe('server', function () {
  var server = require('../lib/server.js');

  before(function (done) {
    server.start(3000, '// this is some javascript', { 'index.html': 'static content' }, done);
    request = request('http://localhost:3000');
  });

  describe('#start()', function () {
    it('should make server respond with HTML', function (done) {
      request.get('/').expect(200).end(function (err, res) {
        res.text.should.containEql('<!DOCTYPE html>');
        done(err);
      });
    });

    it('should make server also respond with javascript', function (done) {
      request.get('/__client/client.js').expect(200).end(function (err, res) {
        res.text.should.containEql('// this is some javascript');
        done(err);
      });
    });

    it('should make server also respond with static content', function (done) {
      request.get('/__static/index.html').expect(200).end(function (err, res) {
        res.text.should.containEql('static content');
        done(err);
      });
    });
  });

  describe('#reload()', function () {
    before(function () {
      server.reload('// this is some new javascript', { 'index.html': 'new static content' })
    });

    it('should make server respond with new javascript', function (done) {
      request.get('/__client/client.js').expect(200).end(function (err, res) {
        res.text.should.containEql('// this is some new javascript');
        done(err);
      });
    });

    it('should make server respond with new static content', function (done) {
      request.get('/__static/index.html').expect(200).end(function (err, res) {
        res.text.should.containEql('new static content');
        done(err);
      });
    });
  });

  describe('#kill()', function () {
    before(function () {
      server.kill();
    });

    it('should make server not respond', function (done) {
      request.get('/').end(function (err, res) {
        err.should.be.ok;
        done();
      });
    });
  });
});
