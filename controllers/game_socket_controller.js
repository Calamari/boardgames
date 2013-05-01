/*jslint node: true */
"use strict";

var mongoose = require('mongoose');

module.exports = function(socketeer, app) {
  var Game = mongoose.model('Game');

  socketeer.on('action', function(data, cb) {
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
          if (err) {
            cb({ error: err.message, actualPlayer: game.actualPlayer });
          } else {
            cb(data);
          }
        });
      }
    });
  });
};
