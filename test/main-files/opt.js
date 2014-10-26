
/* global require, module */

var path = require('path');
var Cheese = require('../../lib/main.js');

Cheese
.opt({
  'synchronize db': false,
  'db file path': path.join(__dirname, 'db')
})
.allow(function () {
  return false;
});

module.exports = Cheese;
