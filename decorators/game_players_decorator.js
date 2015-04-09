/*jslint node: true */
"use strict";

function toBool(value) {
  return value ? 'true' : 'false';
}

/**
 * Decorator class for preparing game objects so they can be handled by handlebars
 */

function decorator(game) {
  var players = game.players.map(function(playerName, index) {
    if (game.hotseat) {
      playerName = 'Player ' + (index+1);
    }
    var isRemotePlayer = true;
    if (game.hotseat || index+1 === game.actualPlayer) {
      isRemotePlayer = false;
    }
    return 'new Player("' + playerName + '", ' + toBool(isRemotePlayer) + ')';
  })

  var decoratedGame = {
    // it's a String for the frontend js
    players : '[' + players.join(',') + ']'
  };
  decoratedGame.prototype = game.prototype;

  return decoratedGame;
}

module.exports = function GamePlayersDecorator(game) {
  if (Array.isArray(game)) {
    return game.map(function(game) { return decorator(game); });
  }
  return decorator(game);
};
