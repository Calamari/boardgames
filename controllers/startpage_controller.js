/*jslint node: true */
"use strict";

var auth      = require('../filters/authentication'),
    mongoose  = require('mongoose'),
    jaz       = require('jaz-toolkit'),

    GameDecorator = require('../decorators/game_decorator');


module.exports = function(app) {
  var User = mongoose.model('User'),
      Game = mongoose.model('Game');

  function gamesOfPlayer(req, res, next) {
    var username = req.user.username;

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

  app.get('/', auth.redirectIfLogin, gamesOfPlayer, loadPlayersOfGames, function(req, res, next) {
    res.render('index', {
      user         : req.user,
      username     : req.user.username,
      openGames    : new GameDecorator(req.openGames, req.user.username, req.users),
      runningGames : new GameDecorator(req.runningGames, req.user.username, req.users),
      waitingGames : new GameDecorator(req.waitingGames, req.user.username, req.users),
      users        : req.users,
      channel      : '_free'
    });
  });

  app.get('/games/archive', auth.redirectIfLogin, gamesOfPlayer, loadPlayersOfGames, function(req, res, next) {
    res.render('games/archive', {
      username: req.user.username,
      endedGames: new GameDecorator(req.endedGames, req.user.username, req.users),
      users: req.users,
      channel: '_free'
    });
  });

  app.get('/patterns', auth.redirectIfLogin, function(req, res, next) {
    res.render('patterns');
  });
};
