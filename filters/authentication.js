/*jslint node: true */
"use strict";

var passport      = require('passport'),
    LocalStrategy = require('passport-local').Strategy,

    mongoose      = require('mongoose');


function redirectIfLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login?redir=' + encodeURIComponent(req.originalUrl));
  }
}

module.exports = {
  configure: function() {
    var User = require('../models/user');

    passport.use(new LocalStrategy(
      function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
          if (err) { return done(err); }

          if (!user) {
            return done(null, false, { message: 'Incorrect username and/or password.' });
          }

          !user.validatePassword(password, function(err, result) {
            if (err) { return done(err); }
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: 'Incorrect username and/or password.' });
            }
          });
        });
      }
    ));

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user);
      });
    });
  },
  redirectIfLogin: redirectIfLogin//passport.authenticate('local', { failureRedirect: '/login' })
};
