/*jslint node: true */
"use strict";

function getDistance(from, to) {
  if (from === to) {
    return 0;
  }
  var xDistance = Math.abs(Math.abs(from[0]) - Math.abs(to[0])),
      yDistance = Math.abs(Math.abs(from[1]) - Math.abs(to[1]));
  return Math.max(xDistance, yDistance);
}

function getNeighbours(x, y) {
  var fields = [],
      xi, yi;

  for (xi=x-1; xi <= x+1; ++xi) {
    for (yi=y-1; yi <= y+1; ++yi) {
      if (xi >= 0 && xi <= 7 && yi >= 0 && yi <= 7) {
        fields.push([xi, yi]);
      }
    }
  }
  return fields;
}
function captureUnitsAround(stones, playerNumber, x, y) {
  var capturedPieces = [];
  getNeighbours(x, y).forEach(function(field) {
    if (stones[field[1]][field[0]] && stones[field[1]][field[0]] !== playerNumber) {
      stones[field[1]][field[0]] = playerNumber;
      capturedPieces.push(field);
    }
  });
  return capturedPieces;
}

var gameDef = {
  minPlayers: 2,
  maxPlayers: 2,
  newBoard: function() {
    var stones = [];
    for (var x=0; x<8; ++x) {
      stones[x] = [];
    }
    stones[0][0] = 1;
    stones[7][0] = 1;
    stones[0][7] = 2;
    stones[7][7] = 2;
    return {
      stones: stones
    };
  },
  actions: {
    move: function(game, data, cb) {
      var from = data.from,
          to   = data.to,
          playerNumber = game.getPlayerPosition(data.user),
          addPieces, removePieces, capturedPieces,
          distance;

      if (!game.started) {
        cb(new Error('GAME_NOT_STARTED'));
      } else if (!from || !to) {
        cb(new Error('ARGUMENT_ERROR'));
      } else if (!game.isPlayersTurn(playerNumber)) {
        cb(new Error('NOT_YOUR_TURN'));
      } else if (game.board.stones[from[1]][from[0]] !== playerNumber) {
        cb(new Error('NOT_YOUR_PIECE'));
      } else {
        distance = getDistance(from, to);
        if (distance > 2 || game.board.stones[to[1]][to[0]]) {
          // to far or field already occupied
          cb(new Error('INVALID_MOVE'));
        } else {
          addPieces = [];
          removePieces = [];
          if (distance === 2) {
            game.board.stones[from[1]][from[0]] = 0;
            removePieces.push(from);
          }
          game.board.stones[to[1]][to[0]] = playerNumber;
          addPieces.push(to);
          capturedPieces = captureUnitsAround(game.board.stones, playerNumber, to[0], to[1]);
          game.nextTurn();
          cb(null, {
            addPieces      : addPieces,
            removePieces   : removePieces,
            capturedPieces : capturedPieces,
            newPlayer      : game.actualPlayer
          });
        }
      }
    }
  }
};
module.exports = gameDef;
