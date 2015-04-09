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

function getWinner(game) {
  var counts = { 1: 0, 2: 0 },
      x, y;

  for (y=0; y<8; ++y) {
    for (x=0; x<8; ++x) {
      if (game.board.stones[y][x] > 0) {
        ++counts[game.board.stones[y][x]];
      }
    }
  }
  return counts[1] > counts[2] ? 1 : 2;
}

// TODO: this should move to an board object or somethin'
function getStone(board, x, y) {
  if (typeof x !== 'number') {
    y = x.y;
    x = x.x;
  }
  return board[y] && board[y][x];
}

// COPY FROM reversi.js (could be done in something like Regular Board object?)
function countStones(game) {
  var counts = { 1: 0, 2: 0 },
      x, y;

  for (y=0; y<8; ++y) {
    for (x=0; x<8; ++x) {
      if (game.board.stones[y][x] > 0) {
        ++counts[game.board.stones[y][x]];
      }
    }
  }

  return counts;
}

function canStoneOfPlayerMoveHere(board, x, y, playerNr) {
  var dx, dy;
  for (dy=-2; dy<=2; ++dy) {
    for (dx=-2; dx<=2; ++dx) {
      if (getStone(board, x+dx, y+dy) === playerNr) {
        return true;
      }
    }
  }
  return false;
}

function checkForGameEnding(game) {
  var x,y;
  for (y=0; y<8; ++y) {
    for (x=0; x<8; ++x) {
      if (!getStone(game.board.stones, x, y)) {
        if (canStoneOfPlayerMoveHere(game.board.stones, x, y, game.actualPlayer)) {
          return null;
        }
      }
    }
  }
  return { winner: getWinner(game) };
}

var gameDef = {
  getDefinition: function() { return this; },
  onStart: function() {},
  minPlayers: 2,
  maxPlayers: 2,
  boardSize: 8,
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
  calcScore: countStones,
  actions: {
    move: function(game, data, cb) {
      var from = data.from,
          to   = data.to,
          playerNumber = game.actualPlayer,
          addPieces, movePieces, capturedPieces,
          distance;

      // from and to can be point objects or arrays with 2 numbers
      if (Array.isArray(from)) {
        from = { x: from[0], y: from[1] };
      }
      if (Array.isArray(to)) {
        to = { x: to[0], y: to[1] };
      }

      if (!from || !to) {
        cb(new Error('ARGUMENT_ERROR'));
      } else if (game.board.stones[from.y][from.x] !== playerNumber) {
        cb(new Error('NOT_YOUR_PIECE'));
      } else {
        distance = getDistance(from, to);
        if (distance > 2 || game.board.stones[to.y][to.x]) {
          // to far or field already occupied
          cb(new Error('INVALID_MOVE'));
        } else {
          addPieces = [];
          movePieces = [];
          if (distance === 2) {
            game.board.stones[from.y][from.x] = 0;
            movePieces.push({ from: from, to: to });
          } else {
            to.player = playerNumber;
            addPieces.push(to);
          }
          game.board.stones[to.y][to.x] = playerNumber;
          capturedPieces = captureUnitsAround(game.board.stones, playerNumber, to.x, to.y);
          game.nextTurn();
          game.markModified('board');
          game.addToLog('move', playerNumber, { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } });
          cb(null, {
            addPieces      : addPieces,
            movePieces     : movePieces,
            capturedPieces : capturedPieces,
            newPlayer      : game.actualPlayer,
            gameEnded      : checkForGameEnding(game)
          });
        }
      }
    }
  }
};
module.exports = gameDef;
