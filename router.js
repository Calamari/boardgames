/*jslint node: true */
"use strict";

var dispatch   = require('dispatch'),
    mongoose   = require('mongoose'),
    passport   = require('passport'),

    auth       = require('./filters/authentication'),
    templates  = require('./lib/templates'),
    Action     = require('./helpers').Action,

    User       = require('./models/user'),
    jaz        = require('jaz-toolkit');

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


// Could also be the other way arround, that gamesOfPlayer will push them in a to-load list
// and don't be pulled afterwards like this
function loadPlayersOfGames(req, res, next) {
  var username = req.user.username,
      names    = [],
      games    = [req.endedGames, req.runningGames, req.waitingGames, req.openGames];

  games = jaz.Array.flatten(games);
  names = games.map(function(game) { return game.getOpponents(username); });
  names = jaz.Array.uniq(jaz.Array.flatten(names));

  User.find({ username: { $in: names } }, function(err, users) {
    req.users = {};
    req.users[username] = req.user;
    users.forEach(function(user) {
      req.users[user.username] = user;
    });
    next();
  });
}


module.exports = dispatch({
  '/': new Action([auth.redirectIfLogin, gamesOfPlayer, loadPlayersOfGames], function(req, res, next) {
    res.html(templates.index({
      errorMessage: req.flash('error'),
      successMessage: req.flash('success'),
      username: req.user.username,
      openGames: req.openGames,
      runningGames: req.runningGames,
      waitingGames: req.waitingGames,
      endedGames: req.endedGames,
      users: req.users,
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
      res.html(templates.login_show({
        action: '/login' + (req.query.redir ? '?redir=' + encodeURIComponent(req.query.redir) : ''),
        success: req.flash('success'),
        error: req.flash('error')
      }));
    }),
    POST: new Action(function(req, res, next) {
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
    }),
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
