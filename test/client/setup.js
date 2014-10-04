
/* global mocha, Cheese */

var index = Cheese.request('static/index.html');

Cheese.route('/', function () {
  Cheese.opt('update DOM', false);
  return index;
});

mocha.setup('bdd');
