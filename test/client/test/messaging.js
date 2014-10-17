
/* global describe, it, Cheese */

describe('Cheese.socket', function () {
  describe('#emit(), #on()', function () {
    it('should send & receive messages', function (done) {
      Cheese
      .socket.emit('hello')
      .socket.on('world', function () {
        done();
      });
    });

    it('should accept objects as arguments', function (done) {
      Cheese
      .socket.emit('hello')
      .socket.on({
        'world': function () {
          done();
        }
      });
    });

    it('should work with mutiple handlers', function (done) {
      var one = false;
      var two = false;

      Cheese
      .socket.on('world', function () {
        one = true;
      })
      .socket.on('world', function () {
        two = true;
      })
      .socket.emit('hello');

      window.setTimeout(function () {
        one.should.be.true;
        two.should.be.true;

        done();
      }, 100);
    });
  });
});
