
/* global require, module */

var Cheese = require('../../lib/main.js');

Cheese.opt({
  'foo': 'bar',
  'baz': 'quux'
});

module.exports = Cheese;
