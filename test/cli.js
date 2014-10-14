
/* global require, describe, it, before, after */

var path = require('path');
var fs = require('fs');

var should = require('should');
var request = require('supertest');

var cli = require('../bin/cli.js');

describe('cli', function () {
  var server;

  before(function () {
    request = request('http://localhost:3000');
  });

  describe('#startServer()', function () {
    before(function (done) {
      server = cli.startServer(path.join(__dirname, 'test-app'),
                               3000, false, done);
    });

    it('should start a server', function () {
      request.get('/').expect(200);
    });

    it('should correctly guess what is static content', function (done) {
      var cssPath = path.join('/__static', __dirname, 'test-app', 'style.css');

      request.get(cssPath).expect(200).end(function (err, res) {
        res.text.should.containEql('/* style.css */');
        done(err);
      });
    });

    it('should correctly guess what is javascript', function (done) {
      request.get('/__client/client.js').expect(200).end(function (err, res) {
        res.text.should.containEql('// app.js');
        done(err);
      });
    });
  });

  describe.skip('#watchFiles()', function () {
    var watcher;

    before(function (done) {
      watcher = cli.watchFiles(path.join(__dirname, 'test-app'));

      setTimeout(done, 200);
    });

    it('should reload when files change', function (done) {
      var cssPath = path.join(__dirname, 'test-app', 'style.css');
      var oldContents = fs.readFileSync(cssPath, { encoding: 'utf-8' });

      fs.writeFileSync(cssPath, '/* new style.css */');

      setTimeout(function () {
        request.get(path.join('/__static', cssPath))
        .expect(200).end(function (err, res) {
          res.text.should.containEql('/* new style.css */');

          fs.writeFile(cssPath, oldContents, done);
        }, 200);
      });
    });

    after(function () {
      watcher.close();
    });
  });

  after(function () {
    server.kill();
  });
});
