var Cheese = {
  db: {},
  staticData: {}
};

Cheese.request = function (url, callback) {
  this.staticData[url] = callback;
};

module.exports = Cheese;
