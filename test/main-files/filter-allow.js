
/* global require, module */

var Cheese = require('../../lib/main.js');

if (! Cheese.db.users)
  Cheese.db.users = [{ name: 'foobar', bazquux: 'test', password: 'bazquux' },
                     { name: 'barbaz', bazquux: 'test', password: 'abcxyz' },
                     { name: 'asdf', bazquux: 'test', password: 'riffzingle' }];

Cheese
.filter([
  function (diff) {
    var users = diff.users;

    for (var k in users) {
      if (users[k] === null) continue;

      delete users[k].password;
    }

    return diff;
  },
  function (diff) {
    var users = diff.users;

    for (var k in users) {
      if (users[k] === null) continue;

      delete users[k].bazquux;
    }

    return diff;
  }
])
.allow([
  function (diff) {
    var users = diff.users;

    for (var k in users) {
      if (users[k] === null) continue;
      if (users[k].password) return false;
    }

    return true;
  },
  function (diff) {
    return (diff.bad !== 'things');
  }
]);

module.exports = Cheese;
