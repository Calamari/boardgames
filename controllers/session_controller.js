/*jslint node: true */
'use strict';

var auth      = require('../filters/authentication'),
    passport  = require('passport'),
    mongoose  = require('mongoose');


module.exports = function(app) {
  var User = mongoose.model('User');

  app.get('/login', function(req, res) {
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

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
  });

  app.get('/register', function(req, res) {
    res.render('register');
  });
  app.post('/register', function(req, res) {
    function showRegisterPage(errors, user) {
      res.render('register', {
        errors: errors,
        user: user || {}
      });
    }

    if (req.body.password !== req.body.password2) {
      showRegisterPage({ password2: { message: 'Passwords do not match' } }, req.body);
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
          showRegisterPage(err.errors, user);
        } else {
          req.flash('success', 'Welcome ' + user.username + '. You can now login.');
          res.redirect('/');
        }
      });
    }
  });
};
