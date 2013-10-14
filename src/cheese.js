#!/usr/bin/env node

var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var server = require('./server.js');

// opt parsing
var usage = 'Usage: cheese [--help] [<directory>] [<port>]';
var opt = require('optimist')
        .usage(usage)
        .boolean('help')
        .alias('help', 'h')
        .describe('help', 'Show this help message and exit');

if (opt.argv.help) opt.showHelp();

server(3000);
