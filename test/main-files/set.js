
var Cheese = require('../../lib/main.js');

Cheese.set('synchronize db', false);

Cheese.allow(function () {
  return false;
});

module.exports = Cheese;
