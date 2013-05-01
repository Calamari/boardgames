/*jslint node: true */
"use strict";

var undef;

function getDistance(from, to) {
  if (from === to) {
    return 0;
  }
  var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
      yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
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
      field = {
        x: field[0],
        y: field[1],
        player: playerNumber
      };
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

      // from and to can be point objects or arrays with 2 numbers
      if (Array.isArray(from)) {
        from = { x: from[0], y: from[1] };
      }
      if (Array.isArray(to)) {
        to = { x: to[0], y: to[1] };
      }

      if (!game.started) {
        cb(new Error('GAME_NOT_STARTED'));
      } else if (!from || !to) {
        cb(new Error('ARGUMENT_ERROR'));
      } else if (!game.isPlayersTurn(playerNumber)) {
        cb(new Error('NOT_YOUR_TURN'));
      } else if (game.board.stones[from.y][from.x] !== playerNumber) {
        cb(new Error('NOT_YOUR_PIECE'));
      } else {
        distance = getDistance(from, to);
        if (distance > 2 || game.board.stones[to.y][to.x]) {
          // to far or field already occupied
          cb(new Error('INVALID_MOVE'));
        } else {
          addPieces = [];
          removePieces = [];
          if (distance === 2) {
            game.board.stones[from.y][from.x] = 0;
            removePieces.push(from);
          }
          game.board.stones[to.y][to.x] = playerNumber;
          to.player = playerNumber;
          addPieces.push(to);
          capturedPieces = captureUnitsAround(game.board.stones, playerNumber, to.x, to.y);
          game.nextTurn();
          game.markModified('board');
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
