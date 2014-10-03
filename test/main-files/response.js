
/* global require, module */

var Cheese = require('../../lib/main.js');

Cheese.response('/hello', function () {
  return 'hello world';
});

module.exports = Cheese;

