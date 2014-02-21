/*jslint node: true */
"use strict";

var _ = require('lodash'),
    undef;

function getDistance(from, to) {
  if (from === to) {
    return 0;
  }
  var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
      yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
  return Math.max(xDistance, yDistance);
}

// Change if not Tablut
function getNeighbours(x, y) {
  return _.filter([ [x+1, y], [x-1, y], [x, y+1], [x, y-1] ], function(f) {
    return (f[0] >= 0 && f[0] <= 7 && f[1] >= 0 && f[1] <= 7);
  });
}

function captureUnitsAround(stones, playerNumber, x, y) {
  var removePieces = [],
      x1, y1, x2, y2, field, orthoDir;

  [ [1,0], [-1,0], [0,1], [0,-1] ].forEach(function(dir) {
    x1 = x+dir[0];
    y1 = y+dir[1];
    if (stones[y1] && stones[y1][x1] && parseInt(stones[y1][x1], 10) !== playerNumber) {
      x2 = x+dir[0]*2;
      y2 = y+dir[1]*2;
      if (stones[y2] && stones[y2][x2] && parseInt(stones[y2][x2], 10) === playerNumber || isCornerField(x2, y2) || isCenterField(x2, y2)) {
        if (stones[y1][x1][1] === 'k') {
          orthoDir = dir[0] === 0 ? [1,0] : [0,1];
          if ((parseInt(stones[y1+orthoDir[1]][x1+orthoDir[0]], 10) === playerNumber || isCornerField(x1+orthoDir[0], y1+orthoDir[1]) || isCenterField(x1+orthoDir[0], y1+orthoDir[1])) &&
              (parseInt(stones[y1-orthoDir[1]][x1-orthoDir[0]], 10) === playerNumber || isCornerField(x1-orthoDir[0], y1-orthoDir[1]) || isCenterField(x1-orthoDir[0], y1-orthoDir[1]))) {
            field = {
              x: x1,
              y: y1,
              king: true
            };
            removePieces.push(field);
          }
        } else {
          stones[y1][x1] = '';
          field = {
            x: x1,
            y: y1
          };
          removePieces.push(field);
        }
      }
    }
  });
  return removePieces;
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

function isPathClear(board, from, to) {
  var dirX = to.x - from.x,
      dirY = to.y - from.y,
      x    = from.x,
      y    = from.y;

  dirX = dirX > 0 ? 1 : (dirX < 0 ? -1 : 0);
  dirY = dirY > 0 ? 1 : (dirY < 0 ? -1 : 0);

  while(x !== to.x || y !== to.y) {
    y += dirY;
    x += dirX;
    if (getStone(board, x, y)) {
      return false;
    }
  }
  return true;//!getStone(board, to.x, to.y);
}

function checkForGameEnding(stones, removePieces) {
  if (stones[0][0] === '1k' || stones[0][8] === '1k' || stones[8][0] === '1k' || stones[8][8] === '1k') {
    return { winner: 1 };
  }
  if (_.filter(removePieces, function(piece) {
    return !!piece.king;
  }).length) {
    return { winner: 2 };
  }
}

var BOARD_DESC = {
  'X': 'X',
  '1': '1s',
  '2': '2s',
  'K': '1k',
  ' ': ''
};

var _defaultDef = {
  onStart: function() {},
  minPlayers: 2,
  maxPlayers: 2
};

function isKing(piece) {
  return piece && piece[1] === 'k';
}

// Method has to change for other versions as Tablut
function isCornerField(x, y) {
  if (y === undefined) {
    // Is is either a point or an array
    y = x.y || x[1] || 0;
    x = x.x || x[0] || 0;
  }
  return (x === 0 && y === 0) ||
         (x === 0 && y === 8) ||
         (x === 8 && y === 0) ||
         (x === 8 && y === 8);
}

// Method has to change for other versions as Tablut
function isCenterField(x, y) {
  if (y === undefined) {
    // Is is either a point or an array
    y = x.y || x[1] || 0;
    x = x.x || x[0] || 0;
  }
  return (x === 4 && y === 4);
}

var gameDef = {
  getDefinition: function(options) {
    return this.definitions[options.type];
  },
  definitions: {
    Tablut: _.merge(_.clone(_defaultDef), {
      boardLayout: [
        '   222   ',
        '    2    ',
        '    1    ',
        '2   1   2',
        '2211K1122',
        '2   1   2',
        '    1    ',
        '    2    ',
        '   222   '
      ],
      boardSize: 9,
      newBoard: function() {
        var stones = [],
            layout = gameDef.definitions.Tablut.boardLayout,
            x, y;

        for (y=layout.length; y--;) {
          stones[y] = [];
          for (x=layout[y].length; x--;) {
            stones[y][x] = BOARD_DESC[layout[y][x]] || '';
          }
        }
        return {
          stones: stones
        };
      },
      actions: {
        move: function(game, data, cb) {
          var from = data.from,
              to   = data.to,
              playerNumber = game.getPlayerPosition(data.user),
              addPieces, movePieces, removePieces,
              piece;

          // from and to can be point objects or arrays with 2 numbers
          if (Array.isArray(from)) {
            from = { x: from[0], y: from[1] };
          }
          if (Array.isArray(to)) {
            to = { x: to[0], y: to[1] };
          }

          if (!from || !to) {
            return cb(new Error('ARGUMENT_ERROR'));
          }

          piece = game.board.stones[from.y][from.x];

          if (parseInt(piece, 10) !== playerNumber) {
            cb(new Error('NOT_YOUR_PIECE'));
          } else {
            if ((from.x === to.x || from.y === to.y) && !(from.x === to.x && from.y === to.y) && isPathClear(game.board.stones, from, to)) {
              if (isCenterField(to) || (isCornerField(to) && !isKing(piece))) {
                return cb(new Error('INVALID_MOVE'));
              }
              movePieces = [];
              game.board.stones[from.y][from.x] = '';
              movePieces.push({ from: from, to: to });

              game.board.stones[to.y][to.x] = piece;
              removePieces = captureUnitsAround(game.board.stones, playerNumber, to.x, to.y);
              game.nextTurn();
              game.markModified('board');
              game.addToLog('move', playerNumber, { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } });
              cb(null, {
                movePieces     : movePieces,
                removePieces   : removePieces,
                newPlayer      : game.actualPlayer,
                gameEnded      : checkForGameEnding(game.board.stones, removePieces)
              });
            } else {
              // dont move diagonal
              cb(new Error('INVALID_MOVE'));
            }
          }
        }
      }
    })
  }
};
module.exports = gameDef;
