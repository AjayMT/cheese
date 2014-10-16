
/* global it, describe, should, Cheese */

describe('Cheese.startup', function () {
  it('should get called', function (done) {
    Cheese.startup(done, true);
  });

  it('should work with arrays', function () {
    var one = false;
    var two = false;

    Cheese.startup([
      function () {
        one = true;
      },
      function () {
        two = true;
      }
    ], true);

    one.should.be.true;
    two.should.be.true;
  });
});
