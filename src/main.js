var fs = require('fs');
var path = require('path');
var dbFile;

var Cheese = {
  db: {},
  staticData: {}
};

Cheese.response = function (url, callback) {
  this.staticData[url] = callback;
};

Object.defineProperty(Cheese, 'dbFile', {
  get: function () {
    return dbFile;
  },
  set: function (newPath) {
    dbFile = path.resolve(newPath);
    
    if (fs.existsSync(dbFile))
      Cheese.db = JSON.parse(fs.readFileSync(dbFile, { encoding: 'utf-8' }));
    else
      fs.writeFileSync(dbFile, JSON.stringify(Cheese.db));
  }
});

module.exports = Cheese;
