
/* global require, module */

var Cheese = require('../../lib/main.js');

if (! Cheese.db.users)
  Cheese.db.users = [{ name: 'foobar', password: 'bazquux' },
                     { name: 'barbaz', password: 'abcxyz' },
                     { name: 'asdf', password: 'riffzingle' }];

Cheese.filter(function (diff) {
  var users = diff.users;

  for (var k in users) {
    if (users[k] === null) continue;

    delete users[k].password;
  }

  return diff;
});

Cheese.allow(function (diff, clientDB) {
  var users = diff.users;

  for (var k in users) {
    if (users[k] === null) continue;
    if (users[k].password) return false;
  }

  return true;
});

module.exports = Cheese;

