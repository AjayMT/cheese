
/* global require, module */

var fs = require('fs');
var path = require('path');
var browserify = require('browserify');

module.exports = function (client) {
  var bundle = browserify(client);

  return function (req, res, next) {
    var stream = fs.createReadStream(path.join(__dirname, 'index.html'));

    if (req.path === '/__client')
      stream = bundle.bundle();

    stream.pipe(res);
    stream.on('end', next);
  }
}
