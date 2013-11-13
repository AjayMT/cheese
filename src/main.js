var Cheese = {
  db: {},
  staticData: {}
};

Cheese.response = function (url, callback) {
  this.staticData[url] = callback;
};

module.exports = Cheese;
