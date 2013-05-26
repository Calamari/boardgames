/*jslint node: true */
"use strict";

var mongoose = require('mongoose'),
    bcrypt   = require('bcrypt'),

    Statistics = require('./statistic'),

    SALT_WORK_FACTOR = 10;

var userSchema = mongoose.Schema({
    username: { 'type': String, 'required': true, min: 3, index: { unique: true } },
    password: { 'type': String, 'required': true, min: 6 },
    email: { 'type': String, 'required': true, match: /[^@]+@[^@]+\.[^@]{1,6}/, index: { unique: true } },
    createdAt: { 'type': Date, 'default': Date.now },
    lastLoginAt: { 'type': Date, 'default': Date.now },
    stats: { 'type': Object, 'default': {} }
});

userSchema.path('username').validate(function(value) {
  return value && value.length >= 3;
});

userSchema.path('password').validate(function(value) {
  return value && value.length >= 6;
});

userSchema.methods.validatePassword = function(testPassword, cb) {
  bcrypt.compare(testPassword, this.password, function(err, isMatch) {
    if (err) { return cb(err); }
    cb(null, isMatch);
  });
};

userSchema.virtual('statistics').get(function () {
  return this._statistics || new Statistics(this);
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

var User = mongoose.model('User', userSchema);
module.exports = User;
