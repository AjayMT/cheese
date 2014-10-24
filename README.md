# Cheese

[![](https://travis-ci.org/AjayMT/cheese.svg?branch=develop)](http://travis-ci.org/AjayMT/cheese)

Cheese is a minimalistic and flexible javascript web framework that lets you build reactive apps with the libraries you want. This means you don't have to worry about client-server communication, you don't have to worry about updating the DOM, you don't have to worry about a database server, you get lots of flexibility and a high degree of customization, and your app is extremely portable because it runs wherever you have [node](http://nodejs.org). When you use Cheese, all you need to worry about is your app.

**As of now, Cheese is pretty beta-ish, and is evolving quickly. It may not be completely stable yet, so use it at your own risk.**

## Installation

Get [node](http://nodejs.org) if you don't have it. Then do the following:

```sh
$ npm install -g cheese
```

## Running tests

Clone the repository, `cd` into it and do the following:

```sh
$ npm install # to install devDependencies
$ npm test
```

To run the client-side tests, do this:

```sh
$ cd test/client
$ run
```

And then visit <http://localhost:3000/>.

## Documentation

The [wiki](https://github.com/AjayMT/cheese/wiki).

## License

MIT License. See `./LICENSE` for details.

## Contributing

Cheese is open-source and contributions are welcome. Just make sure that you fork and send a pull request to the **develop** branch, since this is where all development happens (the master branch is the latest stable version).
