
/* global describe, it, before, after, beforeEach, afterEach, $, Cheese */

describe('Cheese.event', function () {
  before(function () {
    Cheese.db = {};
    Cheese.reload();
  });

  beforeEach(function () {
    Cheese.events = {};
    Cheese.reload();
  });

  afterEach(function () {
    Cheese.events = {};
    Cheese.reload();
  });

  it('should call the handler when the event is triggered', function (done) {
    Cheese.event('click', 'body', function () {
      done();
    });

    $('body').trigger('click');
  });

  it('should call Cheese.reload()', function (done) {
    Cheese
    .event('click', 'body', function () {
      Cheese.db.hello = 'world';
    })
    .socket.on('synchronized', function () {
      done();
    });

    $('body').trigger('click');
  });

  after(function () {
    Cheese.db = {};
    Cheese.reload();
  });
});
