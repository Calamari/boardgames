/*jslint node: true */
"use strict";

var dispatch   = require('dispatch'),
    mongoose   = require('mongoose'),
    passport   = require('passport'),

    auth       = require('./filters/authentication'),
    templates  = require('./lib/templates'),
    Action     = require('./helpers').Action,

    User       = require('./models/user');

require('./models/game');


function gamesOfPlayer(req, res, next) {
  var Game     = mongoose.model('Game'),
      username = req.user.username;

  Game.find({ 'players': username }, function(err, games) {
    if (!err) {
      req.endedGames = games.filter(function(game) {
        return game.ended;
      });
      req.runningGames = games.filter(function(game) {
        return game.started && !game.ended;
      });
      req.waitingGames = games.filter(function(game) {
        return !game.started;
      });
    }
    Game.findWherePlayerCanJoin(username, function(err, games) {
      if (!err) {
        req.openGames = games;
      }
      next();
    });
  });
}


module.exports = dispatch({
  '/': new Action([auth.redirectIfLogin, gamesOfPlayer], function(req, res, next) {
    res.html(templates.index({
      errorMessage: req.flash('error'),
      username: req.user.username,
      openGames: req.openGames,
      runningGames: req.runningGames,
      waitingGames: req.waitingGames,
      endedGames: req.endedGames,
      channel: '_free'
    }));
  }),
  '/game': require('./controllers/game_controller'),
  '/register': {
    GET: new Action(function(req, res, next) {
      res.html(templates.register({
      }));
    }),
    POST: new Action(function(req, res, next) {
      function showRegisterPage(error, user) {
        res.html(templates.register({
          error: error,
          user: user || {}
        }));
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
    })
  },
  '/login': {
    GET: new Action(function(req, res, next) {
      res.html(templates.login({
        success: req.flash('success'),
        error: req.flash('error')
      }));
    }),
    POST: new Action(passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true })),
  },
  '/logout': new Action(function(req, res, next) {
    req.logout();
    res.redirect('/login');
  }),
  '/profile': new Action([auth.redirectIfLogin], function(req, res, next, profileName) {
    res.redirect('/profile/' + req.user.username);
  }),
  '/profile/:profileName': new Action([auth.redirectIfLogin], function(req, res, next, profileName) {
    User.findOne({ username: profileName}, function(err, user) {
      if (err || !user) { return next(); }
      res.html(templates.profile({
        user: user
      }));
    });
  })
});
