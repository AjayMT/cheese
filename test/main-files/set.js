
var path = require('path');
var Cheese = require('../../lib/main.js');

Cheese.set('synchronize db', false);
Cheese.set('db file path', path.join(__dirname, 'db.json'));

Cheese.allow(function () {
  return false;
});

module.exports = Cheese;
