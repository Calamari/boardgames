/*jslint node: true */
"use strict";

var auth      = require('../filters/authentication'),
    Action    = require('../helpers').Action,
    templates = require('../lib/templates'),
    mongoose  = require('mongoose');


function loadGameOr404(req, res, next, id) {
  var Game = mongoose.model('Game');

  Game.findById(id, function(err, game) {
    if (err) {
      res.notFound('404');
    } else {
      req.game = game;
      next();
    }
  });
}

module.exports = {
  '/:id': new Action([auth.redirectIfLogin], function(req, res, next, id) {
    loadGameOr404(req, res, function() {
      req.socketeer.set('gameId', req.game.id);
      req.socketeer.set('username', req.user.username);
      req.socketeer.where({ gameId: req.game.id }).send('events.' + req.game.id, { userEntered: req.user.username });
      res.html(templates.game({
        // That's also bit to much duplication here...
        errorMessage: req.flash('error'),
        successMessage: req.flash('success'),
        canGiveUp:          req.game.started && !req.game.ended && req.game.isPlayer(req.user.username),
        username:           req.user.username,
        game:               req.game,
        thisSpectator:      !req.game.isPlayer(req.user.username),
        thisPlayerPosition: req.game.getPlayerPosition(req.user.username) || 0,
        socketeerId:        req.socketeer.id
      }));
    }, id);
  }),
  '/:id/join': new Action([auth.redirectIfLogin], function(req, res, next, id) {
    loadGameOr404(req, res, function() {
      if (req.game.canJoin(req.user.username)) {
        var events = {
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
    }, id);
  }),
  '/:id/give_up': new Action([auth.redirectIfLogin], function(req, res, next, id) {
    loadGameOr404(req, res, function() {
      var game = req.game;
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

    }, id);
  }),
  // TODO: make a POST request out of it:
  '/:type/new': new Action([auth.redirectIfLogin], function(req, res, next, type) {
    var Game = mongoose.model('Game'),
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
  })
};
