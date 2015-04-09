/*jslint node: true */
"use strict";

var jaz = require('jaz-toolkit'),

    undef;

// TODOs:
// - Win if you capture all enemy stones is missing

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

function getNeighbourStones(board, x, y) {
  var stones = [];

  getNeighbours(x,y).forEach(function(field) {
    if (board[field[1]][field[0]]) {
      stones.push(field);
    }
  });
  return stones;
}

function getTrappedLine(board, x, y, playerNr, dx, dy) {
  var stones = [];

  while (board[y] && board[y][x]) {
    if (board[y][x] !== playerNr) {
      stones.push({ x: x, y: y, player: board[y][x] });
    } else {
      return stones;
    }
    x += dx;
    y += dy;
  }
  return [];
}

function getTrappedLines(board, x, y, playerNr) {
  var trappedLines = [],
      dx, dy, line;

  for (dx=-1; dx <= +1; ++dx) {
    for (dy=-1; dy <= +1; ++dy) {
      if (dx || dy) {
        line = getTrappedLine(board, x+dx, y+dy, playerNr, dx, dy, []);
        if (line.length) {
          trappedLines.push(line);
        }
      }
    }
  }
  return trappedLines;
}

function getCapturedPieces(board, to, playerNr) {
  var trappedLines = getTrappedLines(board, to.x, to.y, playerNr);

  if (trappedLines.length) {
    return jaz.Array.flatten(trappedLines);
  }
  return false;
}

function getStone(board, x, y) {
  if (typeof x !== 'number') {
    y = x.y;
    x = x.x;
  }
  return board[y] && board[y][x];
}

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

function getWinner(game) {
  var counts = countStones(game);
  return counts[1] > counts[2] ? 1 : 2;
}

function checkForGameEnding(game) {
  var counts = countStones(game);

  if (counts[1] + counts[2] === 64) {
    return { winner: getWinner(game) };
  }
  return null;
}

function canMove(game, playerNumber) {
  var x, y;
  for (y=0; y<8; ++y) {
    for (x=0; x<8; ++x) {
      if (!getStone(game.board.stones, x, y)) {
        // if the next user can enclose at least one line, game is not ended yet
        if (getTrappedLines(game.board.stones, x, y, playerNumber).length) {
          return true;
        }
      }
    }
  }
  return false;
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
    stones[3][3] = 1;
    stones[4][3] = 2;
    stones[3][4] = 2;
    stones[4][4] = 1;
    return {
      stones: stones
    };
  },
  calcScore: countStones,
  actions: {
    set: function(game, data, cb) {
      var to   = data.to,
          playerNumber = game.actualPlayer,
          addPieces, removePieces, capturedPieces;

      // from and to can be point objects or arrays with 2 numbers
      if (Array.isArray(to)) {
        to = { x: to[0], y: to[1] };
      }

      if (!to) {
        cb(new Error('ARGUMENT_ERROR'));
      } else if (getStone(game.board.stones, to) || !(capturedPieces = getCapturedPieces(game.board.stones, to, playerNumber))) {
        cb(new Error('INVALID_MOVE'));
      } else {
        addPieces = [];
        game.board.stones[to.y][to.x] = playerNumber;
        to.player = playerNumber;
        addPieces.push(to);
        capturedPieces.forEach(function(stone) {
          stone.player = playerNumber;
          game.board.stones[stone.y][stone.x] = playerNumber;
        });
        if (canMove(game, game.nextPlayerPosition)) {
          game.nextTurn();
        }
        game.markModified('board');

        game.addToLog('set', playerNumber, { to: { x: to.x, y: to.y } });
        cb(null, {
          addPieces      : addPieces,
          capturedPieces : capturedPieces,
          newPlayer      : game.actualPlayer,
          gameEnded      : checkForGameEnding(game)
        });
      }
    }
  }
};
module.exports = gameDef;
