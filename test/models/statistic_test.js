var mongoose  = require('mongoose'),
    sinon     = require('sinon'),
    expect    = require('expect.js'),
    moment    = require('moment'),

    Statistic = require('../../models/statistic'),
    User      = require('../../models/user');

describe('Statistic', function() {
  var validUserAttributes = { username: 'Bob', password: 'qwertz', email: 'bob@gmail.com' },
      todayKey            = moment().utc().format("YYYY-MM-DD"),
      yesterday           = moment().subtract(1, 'day'),
      yesterdayKey        = yesterday.utc().format("YYYY-MM-DD"),
      user, stats;

  beforeEach(function(done) {
    user = new User(validUserAttributes);
    stats = user.statistics;
    user.save(done);
  });

  afterEach(function(done) {
    User.remove(function() {
      done();
    });
  });

  it('getting an key will not mark user as modified', function() {
    stats.get('foo');
    expect(user.isModified()).to.be(false);
    expect(user.isModified('stats')).to.be(false);
  });

  describe('setting an key', function() {
    it('will mark user as modified', function() {
      stats.set('foo', 42);
      expect(user.isModified()).to.be(true);
      expect(user.isModified('stats')).to.be(true);
    });

    it('without date will set value for today', function() {
      stats.set('foo', 10);
      expect(stats.get('foo')).to.eql(10);
    });

    it('with a date will set value for that day only', function() {
      stats.set('foo', 10, yesterday);
      expect(stats.get('foo')).to.be(0);
      expect(stats.get('foo', yesterday)).to.eql(10);
    });

    it('works when called multiple times', function() {
      stats.set('foo', 10);
      stats.set('foo', 23);
      stats.set('foo', 1, yesterday);
      stats.set('bar', 42);
      expect(stats.get('foo')).to.eql(23);
      expect(stats.get('foo', yesterday)).to.eql(1);
      expect(stats.get('bar')).to.eql(42);
    });
  });

  describe('incrementing an key', function() {
    it('will mark user as modified', function() {
      stats.increment('foo');
      expect(user.isModified()).to.be(true);
      expect(user.isModified('stats')).to.be(true);
    });

    it('works when called multiple times', function() {
      stats.increment('foo');
      expect(stats.get('foo')).to.eql(1);
      stats.increment('foo');
      expect(stats.get('foo')).to.eql(2);
    });
  });

  describe('decrementing an key', function() {
    it('will mark user as modified', function() {
      stats.decrement('foo');
      expect(user.isModified()).to.be(true);
      expect(user.isModified('stats')).to.be(true);
    });

    it('works when called multiple times', function() {
      stats.set('foo', 100);
      stats.decrement('foo');
      expect(stats.get('foo')).to.eql(99);
      stats.decrement('foo');
      expect(stats.get('foo')).to.eql(98);
    });
  });

  describe('getting the history of data', function() {
    it('will not mark user as modified', function() {
      stats.getHistory('foo');
      expect(user.isModified()).to.be(false);
      expect(user.isModified('stats')).to.be(false);
    });

    it('returns a Hash with day keys and values', function() {
      stats.set('foo', 100);
      stats.set('foo', 23, yesterday);
      stats.set('bar', 1, yesterday);

      var fooHistory = stats.getHistory('foo');
      var barHistory = stats.getHistory('bar');

      expect(Object.keys(fooHistory)).to.have.length(2);
      expect(fooHistory[todayKey]).to.eql(100);
      expect(fooHistory[yesterdayKey]).to.eql(23);
      expect(Object.keys(barHistory)).to.have.length(1);
      expect(barHistory[yesterdayKey]).to.eql(1);
    });
  });

  describe('getting the sum of a key', function() {
    it('will not mark user as modified', function() {
      stats.getSum('foo');
      expect(user.isModified()).to.be(false);
      expect(user.isModified('stats')).to.be(false);
    });

    it('returns 0 of undefined key', function() {
      expect(stats.getSum('foo')).to.be(0);
    });

    it('returns the correct number', function() {
      stats.set('foo', 100);
      expect(stats.getSum('foo')).to.be(100);
      stats.set('foo', 23, yesterday);
      expect(stats.getSum('foo')).to.be(123);
      stats.increment('foo', yesterday);
      expect(stats.getSum('foo')).to.be(124);
      stats.set('bar', 1, yesterday);
      expect(stats.getSum('foo')).to.be(124);
      stats.decrement('foo');
      expect(stats.getSum('foo')).to.be(123);
    });

    it('is also available as getter for given metrics', function() {
      stats.set('gamesStarted', 100);
      expect(stats.gamesStarted).to.be(100);
      stats.set('gamesStarted', 23, yesterday);
      expect(stats.gamesStarted).to.be(123);

      stats.set('foo', 42);
      expect(stats.foo).to.be(undefined);
    });

  });
});
