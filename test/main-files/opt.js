
var path = require('path');
var Cheese = require('../../lib/main.js');

Cheese.opt('synchronize db', false)
.opt('db file path', path.join(__dirname, 'db.json'))
.allow(function () {
  return false;
});

module.exports = Cheese;
