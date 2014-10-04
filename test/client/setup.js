
/* global mocha, Cheese */

var index = Cheese.request('static/index.html');

Cheese
.opt('update DOM', false)
.route('/', function () {
  return index;
});

mocha.setup('bdd');
