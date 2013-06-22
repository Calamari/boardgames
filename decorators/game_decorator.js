/*jslint node: true */
"use strict";

/**
 * Decorator class for preparing game objects so they can be handled by handlebars
 */

function decorator(game, currentUser, users) {
  var opponentName = game.getOpponents(currentUser)[0],
      opponent;

  if (opponentName) {
    opponent = {
      avatarUrl: users[opponentName].avatarUrl,
      profileUrl: '/profile/' + opponentName,
      name: opponentName
    };
  }

  var decoratedGame = {
    opponent : opponent,
    id       : game.id,
    isTurn   : game.isPlayersTurn(currentUser),
    type     : game.type === 'Multiplication' ? 'cloned' : game.type,
    turns    : game.turns,
    hasWon   : game.winnerName === currentUser,
    hasLost  : game.winnerName !== currentUser
  };
  decoratedGame.prototype = game.prototype;

  return decoratedGame;
}

module.exports = function GameDecorator(game, currentUser, users) {
  if (Array.isArray(game)) {
    return game.map(function(game) { return decorator(game, currentUser, users); });
  }
  return decorator(game, currentUser, users);
};
