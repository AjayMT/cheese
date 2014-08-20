#!/usr/bin/env node

var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var server = require('./server.js');

// opt parsing
var usage = 'Usage: cheese [<port>]\n'
          + '       cheese [--help|-h]\n\n'
          + 'Start a cheese server in the current directory.\n'
          + '<port> is the port to listen on, defaults to 3000.';

var opt = require('yargs')
          .usage(usage)
          .boolean('help')
          .alias('help', 'h')
          .describe('help', 'Show this help message and exit');

if (opt.argv.help) {
  opt.showHelp();
  process.exit(0);
}

var port = opt.argv._[0] || 3000;
var jsonString = fs.readFileSync(path.join('.', 'cheese.json'), { 'encoding': 'utf-8' });
var mainFilePath = JSON.parse(jsonString).main;
var clientFiles = JSON.parse(jsonString).client;
var clientPaths = [];
var clientData = '';
var staticData = {};

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
  if (_.last(elem.split('.')) === 'js')
    clientData += '\n' + fs.readFileSync(elem, { 'encoding': 'utf-8' });
  else {
    staticData[elem] = fs.readFileSync(elem, { 'encoding': 'utf-8' });
  }
});

server(port, clientData, staticData, mainFilePath);
