/*jslint node: true */
"use strict";

var auth      = require('../filters/authentication'),
    mongoose  = require('mongoose');


function loadGameOr404(req, res, next) {
  var Game = mongoose.model('Game'),
      id   = req.params.id;

  Game.findById(id, function(err, game) {
    if (err || !game) {
    // TODO: this has to be done with a call to the ErrorController somehow
      res.send(404, 'Not Found!');
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
      canGiveUp:          req.game.started && !req.game.ended && req.game.isPlayer(req.user.username),
      canJoin:            !req.game.started && !req.game.isPlayer(req.user.username),
      canCancel:          !req.game.started && req.game.owner === req.user.username,
      username:           req.user.username,
      game:               req.game,
      thisSpectator:      !req.game.isPlayer(req.user.username),
      thisPlayerPosition: req.game.getPlayerPosition(req.user.username) || 0
    });
  });

  app.delete('/game/:id', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
    if (!req.game.started && req.game.owner === req.user.username) {
      req.game.remove(function(err) {
        if (err) {
          req.flash('error', 'Game could not be removed.');
        }
        res.redirect('/');
      });
    } else {
      req.flash('error', 'You cannot remove this game.');
      res.redirect('/');
    }
  });

  app.put('/game/:id/join', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
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
        req.game.dataForGameStarted(events);
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

  app.put('/game/:id/cancel', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
    var game = req.game,
        id   = req.params.id;

    if (game.started || game.owner !== req.user.username) {
      req.flash('error', 'Could not cancel game. Game has already started.');
      res.redirect('/game/' + game.id);
    } else {
      game.remove();
      req.flash('success', 'Game has been cancelled');
      res.redirect('/');
    }
  });

  app.put('/game/:id/give_up', auth.redirectIfLogin, loadGameOr404, function(req, res, next) {
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

  app.post('/game/:type', auth.redirectIfLogin, function(req, res, next) {
    var Game = mongoose.model('Game'),
        type = req.params.type,
        game;

    if (type === 'Morris') {
      // TODO: That is a mock right now and has to be replaced with better game start process
      game = new Game({ type: type, config: { type: 9 } });
    } else {
      game = new Game({ type: type });
    }

    game.save(function(err) {
      if (err) {
        req.flash('error', 'Game of type "' + type + '" could not be created.');
        res.redirect('/');
      } else {
        game.addPlayer(req.user.username);
        req.socketeer.send('notification', {
          title:    req.user.username + ' has created a new Game of ' + type,
          url:      '/game/' + game.id,
          linkText: 'Check it out'
        });

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
