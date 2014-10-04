
/* global mocha, Cheese */

Cheese.startup(function () {
  window.setTimeout(mocha.run, 200);
});
