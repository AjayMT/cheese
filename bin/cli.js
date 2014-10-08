#!/usr/bin/env node

/* global require, process, module */

// require()s
var path = require('path');
var fs = require('fs');

var _ = require('lodash');
var chokidar = require('chokidar');
var debug = require('debug')('cheese:cli');

var server = require('../lib/server.js');

// opt parsing
var usage = 'Usage: cheese [<port>] [--dev|-d]\n'
          + '       cheese [--help|-h]\n\n'
          + 'Start a cheese server in the current directory.\n'
          + '<port> is the port to listen on, defaults to 3000.';

var opt = require('yargs')
          .usage(usage)
          .boolean('help')
          .alias('help', 'h')
          .describe('help', 'Show this help message and exit')
          .boolean('dev')
          .alias('dev', 'd')
          .describe('dev', 'Reload the server and reload browsers '
                         + 'automatically when files change');

if (opt.argv.help) {
  opt.showHelp();
  process.exit(0);
}

var port = opt.argv.port || 3000;

// startServer: start a server in directory 'dirname', listening
// on port 'port'. 'reload' is an optional argument used when
// the server is reloaded.
function startServer (dirname, port, reload) {
  debug('starting server on port ' + port);

  if (! reload) reload = false;

  var jsonString = fs.readFileSync(path.join(dirname, 'cheese.json'),
                                   { encoding: 'utf-8' });
  var mainFilePath = JSON.parse(jsonString).main;
  var clientFiles = JSON.parse(jsonString).client;
  var clientPaths = [];
  var clientData = '';
  var staticData = {};

  // traverseDir: traverse a directory tree and return a list
  // of files.
  var traverseDir = function (d) {
    var files = fs.readdirSync(d);
    var finalList = [];
    _.each(files, function (elem, index, list) {
      if (fs.statSync(path.join(d, elem)).isDirectory())
        finalList = finalList.concat(traverseDir(path.join(d, elem)));
      else finalList.push(path.join(d, elem));
    });

    return finalList;
  };

  _.each(clientFiles, function (p) {
    if (fs.statSync(p).isDirectory()) clientPaths = clientPaths.concat(traverseDir(p));
    else clientPaths.push(p);
  });

  clientPaths = _.map(clientPaths, function (p) { return path.join('.', p); });
  _.each(clientPaths, function (elem, index, list) {
    // we assume that file names ending with 'js' aren't static content
    if (_.last(elem.split('.')) === 'js')
      clientData += '\n' + fs.readFileSync(elem, { 'encoding': 'utf-8' });
    else
      staticData[elem] = fs.readFileSync(elem, { 'encoding': 'utf-8' });
  });

  if (! reload) server.start(port, clientData, staticData, mainFilePath);
  else server.reload(clientData, staticData, mainFilePath);
}

// watchFiles: set up a file watcher to reload the server every time
// a file in 'dirname' changes.
function watchFiles (dirname) {
  var watcher = chokidar.watch(path.resolve(dirname), { ignoreInitial: true });

  watcher.on('all', function (change, filepath) {
    filepath = path.resolve(filepath);

    var cheeseJSON = fs.readFileSync(path.join(dirname, 'cheese.json'),
                                     { encoding: 'utf-8' });
    var clientFiles = JSON.parse(cheeseJSON).client;
    var mainFile = path.resolve(JSON.parse(cheeseJSON).main);

    clientFiles = _.map(clientFiles, function (p) { return path.resolve(p); });

    var listed = _.some(_.map(clientFiles, function (p) {
      return _.contains(filepath, p);
    }));

    // only reload when changes are made to files listed in cheese.json
    if (listed || mainFile === filepath) {
      debug('reloading server');
      startServer(dirname, port, true);
    }
  });
}

module.exports = {
  startServer: startServer,
  watchFiles: watchFiles
};

if (require.main === module) {
  startServer('.', port);
  if (opt.argv.dev) watchFiles('.');
}
