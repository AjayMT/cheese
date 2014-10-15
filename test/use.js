
/* global require, describe, it */

var path = require('path');

var should = require('should');

describe('Cheese#use()', function () {
  var Cheese = require('../lib/main.js');
  var main = path.join(__dirname, 'main-files', 'use.js');

  it('should change the Cheese object', function () {
    Cheese.use(function (C) {
      C.opt('hello', 'world');

      return C;
    });

    Cheese.opt('hello').should.equal('world');
  });

  it('should work with main files', function () {
    Cheese.use(main);

    Cheese.opt('foo').should.equal('bar');
  });

  it('should work with arrays', function () {
    Cheese.use([main, function (C) {
      C.opt('abc', 'xyz');

      return C;
    }]);

    Cheese.opt('baz').should.equal('quux');
    Cheese.opt('abc').should.equal('xyz');
  });
});
