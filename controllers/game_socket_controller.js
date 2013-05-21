/*jslint node: true */
"use strict";

var mongoose = require('mongoose');

module.exports = function(socketeer, app) {
  var Game = mongoose.model('Game');

  socketeer.on('action', function(data, cb) {
    try {
      var socket = socketeer.getSocket(this.socketeerId),
          gameId = socket.gameId;

      Game.findById(gameId, function(err, game) {
        if (err) {
          cb({ error: err.message });
        } else if (game.actualPlayer != game.getPlayerPosition(socket.username)) {
          cb({ error: "NOT_YOUR_TURN", actualPlayer: game.actualPlayer });
        } else {
          var action = data.action;
          data.user = socket.username;
          game.action(action, data, function(err, data) {
            console.log("HERE", arguments);
            if (err) {
              cb({ error: err.message, actualPlayer: game.actualPlayer });
            } else {
              if (data.gameEnded) {
                game.endGame(data.gameEnded.winner);
                game.save();
              }
              // TODO: either send not cb or not to same user that receives callback
              // TODO: better would be the move action, so player can do it by themselves (incl. smooth move animation)
              socketeer.where({ gameId: game.id }).send('events', { update: data });
              cb(data);
            }
          });
        }
      });
    } catch(e) {
      cb({ error: 'RELOAD_BROWSER' });
    }
  });
};
