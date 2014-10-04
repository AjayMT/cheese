
/* global describe, it, Cheese */

describe('Cheese.reload', function () {
  it('should synchronize Cheese.db', function (done) {
    Cheese.db.hello = 'world';
    Cheese.reload();
    Cheese.socket.on('synchronized', function () {
      done();
    });
  });
});
