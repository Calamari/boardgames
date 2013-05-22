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
      req.socketeer.where({ gameId: req.game.id }).send('events', { userEntered: req.user.username });
      res.html(templates.game({
        username:           req.user.username,
        game:               req.game,
        thisSpectator:      !req.game.isPlayer(req.user.username),
        thisPlayerPosition: req.game.getPlayerPosition(req.user.username) || 0,
        socketeerId:        req.socketeerId
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
        req.socketeer.where({ gameId: req.game.id }).send('events', events);
        req.game.save(function(err) {
          if (err) { req.flash('error', 'You can not join this game.'); }
          res.redirect('/game/' + req.game.id);
        });
      } else {
        req.flash('error', 'You can not join this game.');
        res.redirect('/game/' + req.game.id);
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
        game.save();
        res.redirect('/game/' + game.id);
      }
    });
  })
};
