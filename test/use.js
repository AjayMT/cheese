
/* global require, describe, it */

var path = require('path');

var should = require('should');

describe('Cheese#use()', function () {
  var Cheese = require('../lib/main.js');

  it('should change the Cheese object', function () {
    Cheese.use(function (C) {
      C.opt('hello', 'world');

      return C;
    });

    Cheese.opt('hello').should.equal('world');
  });

  it('should work with main files', function () {
    Cheese.use(path.join(__dirname, 'main-files', 'use.js'));

    Cheese.opt('foo').should.equal('bar');
  });
});
