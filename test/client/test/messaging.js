
/* global describe, it, Cheese */

describe('Cheese.socket', function () {
  describe('#emit(), #on()', function () {
    it('should send & receive messages', function (done) {
      Cheese.socket.emit('hello');

      Cheese.socket.on('world', function () {
        done();
      });
    });
  });
});
