/*jslint node: true */
"use strict";

var mongoose = require('mongoose'),
    bcrypt   = require('bcrypt'),
    async    = require('async'),

    Statistics = require('./statistic'),

    crypto = require('crypto'),

    uniqueValidator = require('mongoose-unique-validator'),

    SALT_WORK_FACTOR = 10;

function trim(value) {
  return value.trim();
}



var userSchema = mongoose.Schema({
  username: { 'type': String, 'required': [true, 'Please choose a username.'], match: [/^[a-zA-Z0-9_-]{3,}$/, 'Your username has to be at least 3 chars and only alphanumeric characters.'], index: { unique: true } },
  usernameDowncased: { 'type': String, 'required': true, match: /^[a-z0-9_-]{3,}$/, index: { unique: true } },
  password: { 'type': String, 'required': [true, 'Please enter a password.'], match: [/^.{6,}$/, 'Your password has to be at least 6 characters.'] },
  email: { 'type': String, 'required': [true, 'Please enter your email address.'], match: [/[^@]+@[^@]+\.[^@]{1,6}/, 'Your email address does not appear to be valid.'], index: { unique: true }, set: trim },
  createdAt: { 'type': Date, 'default': Date.now },
  lastLoginAt: { 'type': Date, 'default': Date.now },
  stats: { 'type': Object, 'default': {} }
});

userSchema.plugin(uniqueValidator, { message: 'Sorry, but this {PATH} is already taken.' });

userSchema.methods.validatePassword = function(testPassword, cb) {
  bcrypt.compare(testPassword, this.password, function(err, isMatch) {
    if (err) { return cb(err); }
    cb(null, isMatch);
  });
};

userSchema.virtual('statistics').get(function () {
  return this._statistics || new Statistics(this);
});

userSchema.virtual('emailHash').get(function () {
  var hash = crypto.createHash('md5');
  hash.update(this.email.toLowerCase());
  return hash.digest('hex');
});

userSchema.virtual('avatarUrl').get(function () {
  return 'http://www.gravatar.com/avatar/' + this.emailHash + '?d=retro';
});

userSchema.pre('validate', function(next) {
  var user = this;
  if ((!user.usernameDowncased || user.isModified('username')) && user.username) {
    user.usernameDowncased = user.username.toLowerCase();
  }
  next();
});

userSchema.pre('save', function(next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) { return next(); }

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) { return next(err); }

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) { return next(err); }

      // override the cleartext password with the hashed one
      user.password = hash;
      user.salt = salt;
      next();
    });
  });
});

userSchema.statics.incrementStats = function incrementStats(where, statKey, cb) {
  this.find(where, function(err, users) {
    if (!err && users) {
      async.parallel(users.map(function(user) {
        return function(innerCb) {
          user.statistics.increment(statKey);
          user.save(innerCb);
        };
      }), cb);
    } else { cb(err); }
  });
};

var User = mongoose.model('User', userSchema);
module.exports = User;
