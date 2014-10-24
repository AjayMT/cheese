
0.6.61 / 2014-10-24
==================

 * bugfix

0.6.6 / 2014-10-24
==================

 * move diffing stuff into another package
 * multiple event handlers
 * multiple message handlers on the client
 * cheese is an event emitter
 * multiple startup functions
 * connect client even when browserified
 * better test names
 * update test main files
 * export some stuff,
 * multiple allow rules
 * internal simplification of filters
 * use() works with arrays
 * support for multiple filters
 * use() works with main files again
 * use() only works with functions
 * Implement Cheese.use().
 * full ssl support
 * fully functional server-side ssl
 * begin implementing ssl support
 * Tests for the cli
 * Commentary
 * socket.io-client is a proper dependency
 * Only reload server when files listed in cheese.json change
 * Lint some code.
 * Make DOMUtils work with non-jQuery objects
 * Call connect & disconnect handlers with client id instead of client db
 * Change `Cheese` to `this` in a bunch of places.
 * Pin dependency versions
 * Fully functional event maps
 * Require npm-installed query
 * Install jquery with npm
 * Almost fully functional event maps.
 * Write tests for object-map APIs
 * Update README
 * Reduce timeout for test running
 * Tests for Cheese.event
 * Tests for Cheese.socket and Cheese.reload
 * Basic client-side test setup up and running
 * Partially-functional event & route maps on the client
 * Method chaining on the client.
 * Args in static content routes on the server
 * Provide a nicer API that allows you to map things
 * Add nice method-chainability to server API
 * Only request for socket.io script when needed
 * Revert "Fix some require()s for browserify"
 * Fix some require()s for browserify
 * Bump version for README :(
 * get rid of npm debug log
 * Update README
 * Update package.json

0.6.5 / 2014-10-01
==================

 * Implement set() on the client.
 * Write to Cheese.opts['db file path']
 * Remove db.json after test completes
 * Better English.
 * Save db with Cheese.set instead of Cheese.dbFilePath
 * Make travis-ci badge link to travis-ci page
 * Write tests for custom messaging.
 * Implement set() on the server.
 * whitespace stuff
 * Make client requireable with browserify.
 * Revert "Make client requireable"
 * Make client requireable
 * Write tests for filter & allow
 * Use 'forceNew' instead of 'force new connection'
 * Write tests for server-cdp.
 * server-io.js -> server-cdp.js
 * Return the object to which the diff has been applied.
 * Add travis CI badge to README
 * Don't build with node 0.8
 * Fix .travis.yml
 * Add .travis.yml
 * Update README.
 * Update metadata.
 * Write tests for server HTTP.
 * Allow `dom.js` to be required.
 * Reload main file every time server reloads.
 * Implement allow rules.
 * Move cli.js to bin directory.
 * Reorganise some code on the server.
 * Implement basic filters.
 * Re-require socket.io after killing a server; whitespace stuff.
 * Move from underscore to lodash.
 * Specify what directory to start a server in; whitespace stuff.
 * Update README.md
 * src -> lib, cheese.js -> cli.js
 * Fully functional auto-reloading.
 * Start using debug for logging, partially functional auto-reload.
 * Declare console and io as global variables so that my editor shuts up.
 * Define Cheese.socket.emit before calling startup().
 * Fix server-side DB bug.
 * Fix diff bug, rename dbFile variable to dbFilePath, some other stuff.
 * More CLI usage info.
 * Fix client socket API bug.
