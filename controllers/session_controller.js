/*jslint node: true */
"use strict";

var auth      = require('../filters/authentication'),
    passport  = require('passport'),
    mongoose  = require('mongoose');


function loadGameOr404(req, res, next) {
  var Game = mongoose.model('Game'),
      id   = req.params.id;

  Game.findById(id, function(err, game) {
    if (err) {
      res.notFound('404');
    } else {
      req.game = game;
      next();
    }
  });
}

module.exports = function(app) {
  var User = mongoose.model('User');

  app.get('/login', function(req, res, next) {
    res.render('login/show', {
      action: '/login' + (req.query.redir ? '?redir=' + encodeURIComponent(req.query.redir) : ''),
      csrfToken: req.session._csrf
    });
  });
  app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (info) {
        // means problem
        req.flash('error', 'Please enter valid username and password.');
      }
      if (err) { return next(err); }
      if (!user) { return res.redirect(req.originalUrl); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect(req.query.redir || '/');
      });
    })(req, res, next);
  });

  app.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/login');
  });

  app.get('/register', function(req, res, next) {
    res.render('register');
  });
  app.post('/register', function(req, res, next) {
    function showRegisterPage(error, user) {
      res.render('register', {
        error: error,
        user: user || {}
      });
    }

    if (req.body.password !== req.body.password2) {
      showRegisterPage('Passwords do not match');
    } else {
      // make this lines nicer
      var user = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password || ''
      });

      user.save(function(err) {
        if (err) {
          // TODO: make this better
          showRegisterPage(err.message, user);
        } else {
          req.flash('success', 'Welcome');
          res.redirect('/');
        }
      });
    }
  });
};
