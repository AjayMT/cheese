
/* global require, module */

var Cheese = require('../../lib/main.js');

Cheese.response('/:text', function (text) {
  return text;
});

module.exports = Cheese;

