/*jslint node: true */
"use strict";

var auth      = require('../filters/authentication'),
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
  app.get('/game/:id', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
    var id = req.params.id;
    req.socketeer.set('gameId', req.game.id);
    req.socketeer.set('username', req.user.username);
    req.socketeer.where({ gameId: req.game.id }).send('events.' + req.game.id, { userEntered: req.user.username });
    res.render('game', {
      // That's also bit to much duplication here...
      errorMessage: req.flash('error'),
      successMessage: req.flash('success'),
      canGiveUp:          req.game.started && !req.game.ended && req.game.isPlayer(req.user.username),
      username:           req.user.username,
      game:               req.game,
      thisSpectator:      !req.game.isPlayer(req.user.username),
      thisPlayerPosition: req.game.getPlayerPosition(req.user.username) || 0,
      socketeerId:        req.socketeer.id
    });
  });
  app.get('/game/:id/join', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
    var id = req.params.id,
        events;

    if (req.game.canJoin(req.user.username)) {
      events = {
        playerJoined: req.user.username
      };
      req.game.addPlayer(req.user.username);
      if (req.game.isReady()) {
        req.game.startGame();
        events.gameStarted = {
          actualPlayer: req.game.actualPlayer,
          stones: req.game.board.stones
        };
      }
      req.socketeer.where({ gameId: req.game.id }).send('events.' + req.game.id, events);
      req.game.save(function(err) {
        if (err) { req.flash('error', 'You can not join this game.'); }
        req.user.statistics.increment('gamesJoined');
        req.user.save(function() {
          res.redirect('/game/' + req.game.id);
        });
      });
    } else {
      req.flash('error', 'You can not join this game.');
      res.redirect('/game/' + req.game.id);
    }
  });
  // TODO: make a PUT request out of it:
  app.get('/game/:id/give_up', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
    var game = req.game,
        id   = req.params.id;

    // TODO: this implementation works for TWO PLAYERS ONLY
    if (game.ended) {
      req.flash('error', 'Game already ended');
      res.redirect('/game/' + game.id);
    } else {
      var winner = game.getOpponents(req.user.username)[0];
      game.endGame(winner);
      game.save(function(err) {
        if (err) {
          req.flash('error', 'Something bad happened, sorry.');
        } else {
          // THIS CAN BE DONE BETTER, it's basically a copy of actions in game def
          req.flash('success', 'You gave up the game.');
          req.socketeer.where({ gameId: game.id }).send('events.' + game.id, { gameEnded: { winner: winner } } );
        }
        res.redirect('/game/' + game.id);
      });
    }
  });
  // TODO: make a POST request out of it:
  app.get('/game/:type/new', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
    var Game = mongoose.model('Game'),
        type = req.params.type,
        game = new Game({ type: type });

    game.save(function(err) {
      if (err) {
        req.flash('error', 'Game of type "' + type + '"" could not be created.');
        res.redirect('/');
      } else {
        game.addPlayer(req.user.username);
        game.save(function() {
          req.user.statistics.increment('gamesStarted');
          req.user.save(function() {
            res.redirect('/game/' + game.id);
          });
        });
      }
    });
  });
};
