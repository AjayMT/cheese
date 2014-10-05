
/* global describe, it, before, after, beforeEach, afterEach, $, Cheese */
/* global should */

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

  it('should accept objects as arguments', function () {
    var bodyClicked = false;
    var bodyFocused = false;
    var divClicked = false;

    Cheese.event({
      'body': {
        'click': function (e) {
          e.preventDefault();
          bodyClicked = true;
        },
        'focus': function (e) {
          e.preventDefault();
          bodyFocused = true;
        }
      },
      'div': {
        'click': function (e) {
          e.preventDefault();
          divClicked = true;
        }
      }
    });

    $('body').trigger('click').trigger('focus');
    $('div').trigger('click');

    bodyClicked.should.be.true;
    bodyFocused.should.be.true;
    divClicked.should.be.true;
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
