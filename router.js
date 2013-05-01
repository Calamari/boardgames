/*jslint node: true */
"use strict";

var dispatch   = require('dispatch'),
    mongoose   = require('mongoose'),

    auth       = require('./filters/authentication'),
    templates  = require('./lib/templates'),
    Action     = require('./helpers').Action;

require('./models/game');


function gamesOfPlayer(req, res, next) {
  var Game     = mongoose.model('Game'),
      username = req.session.username;

  Game.find({ 'players': username }, function(err, games) {
    if (!err) {
      req.runningGames = games.filter(function(game) {
        return game.started;
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
      username: req.session.username,
      openGames: req.openGames,
      runningGames: req.runningGames,
      waitingGames: req.waitingGames,
      channel: '_free'
    }));
  }),
  '/game': require('./controllers/game_controller'),
  '/login': {
    GET: new Action(function(req, res, next) {
      res.html(templates.login({}));
    }),
    POST: new Action(function(req, res, next) {
      var username = req.body.username.trim();

      if (username) {
        req.session.username = username;
        res.redirect('/');
      } else {
        res.html(templates.login({ error: 'Enter a name!' }));
      }
    })
  },
  '/logout': new Action(function(req, res, next) {
    delete req.session.username;
    res.redirect('/login');
  })
});
