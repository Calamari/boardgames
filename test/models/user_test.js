var mongoose = require('mongoose'),
    sinon    = require('sinon'),
    async    = require('async'),
    expect   = require('expect.js'),

    User     = require('../../models/user');

describe('User', function() {
  var validUserAttributes = { username: 'Bob', password: 'qwertz', email: 'bob@gmail.com' };

  afterEach(function(done) {
    User.remove(function() {
      done();
    });
  });

  describe('validations', function() {
    it('needs a username', function(done) {
      new User({}).save(function(err) {
        expect(err.errors).to.have.key('username');
        done();
      });
    });

    it('needs a username with at least 3 chars', function(done) {
      new User({ username: 'bo' }).save(function(err) {
        expect(err.errors).to.have.key('username');
        done();
      });
    });

    it('work with a username of at least 3 chars', function(done) {
      new User({ username: 'bob' }).save(function(err) {
        expect(err.errors).to.not.have.key('username');
        done();
      });
    });

    it('does not allow strange chars in the username', function(done) {
      var wrongNames = ['äpfel', '<script>', 'feta cheese'];
      async.each(wrongNames, function(name, next) {
        console.log(arguments);
        new User({ username: name }).save(function(err) {
          console.log(err);
          expect(err.errors).to.have.key('username');
          next();
        });
      }, function() { done(); });
    });

    it('needs a email', function(done) {
      new User({}).save(function(err) {
        expect(err.errors).to.have.key('email');
        done();
      });
    });

    it('needs a valid email', function(done) {
      new User({ email: 'bob@gmail' }).save(function(err) {
        expect(err.errors).to.have.key('email');
        done();
      });
    });

    it('works with valid email', function(done) {
      new User({ email: 'bob@gmail.de' }).save(function(err) {
        expect(err.errors).to.not.have.key('email');
        done();
      });
    });

    it('needs a password', function(done) {
      new User({}).save(function(err) {
        expect(err.errors).to.have.key('password');
        done();
      });
    });

    it('needs a password with at least 6 chars', function(done) {
      new User({ password: 'qwert' }).save(function(err) {
        expect(err.errors).to.have.key('password');
        done();
      });
    });

    it('works with a password of at least 6 chars', function(done) {
      new User({ password: 'qwerty' }).save(function(err) {
        expect(err.errors).to.not.have.key('password');
        done();
      });
    });
  });

  describe('pre-save hook', function() {
    var user;
    beforeEach(function(done) {
      user = new User(validUserAttributes);
      user.save(done);
    });

    it('obfuscates the password', function() {
      expect(user.password).to.not.eql('qwertz');
    });
  });

  it('email will be trimmed', function() {
    var user = new User({ email: ' blub@test.de    '});
    expect(user.email).to.eql('blub@test.de');
  });

  describe('#validatePassword', function() {
    var user;
    beforeEach(function(done) {
      user = new User(validUserAttributes);
      user.save(done);
    });

    it('returns true for right result', function(done) {
      user.validatePassword('qwertz', function(err, result) {
        expect(result).to.be(true);
        done();
      });
    });

    it('returns false for wrong password', function(done) {
      user.validatePassword('qwertz ', function(err, result) {
        expect(result).to.be(false);
        done();
      });
    });
  });

  describe('#statistics', function() {
    it('is a Statistic object', function(done) {
      var user = new User({});
      var Statistic = require('../../models/statistic');
      expect(user.statistics).to.be.a(Statistic);
      done();
    });
  });

  describe('#avatarUrl', function() {
    var crypto = require('crypto'),
        hash = crypto.createHash('md5');
    hash.update('meis@cool.com');

    it('works for a given user', function(done) {
      var user = new User({ email: 'MeIs@cool.com ' });
      expect(user.avatarUrl).to.be('http://www.gravatar.com/avatar/' + hash.digest('hex') + '?d=retro');
      done();
    });
  });
});
