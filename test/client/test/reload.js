
/* global describe, it, before, after, Cheese */

describe('Cheese.reload', function () {
  before(function () {
    Cheese.db = {};
    Cheese.reload();
  });

  it('should synchronize Cheese.db', function (done) {
    Cheese.db.hello = 'world';
    Cheese.reload();
    Cheese.socket.on('synchronized', function () {
      done();
    });
  });

  after(function () {
    Cheese.db = {};
    Cheese.reload();
  });
});
