/*jslint node: true */
"use strict";

var jaz = require('jaz-toolkit'),

    undef;

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

  for (y=0; y<13; ++y) {
    for (x=0; x<13; ++x) {
      if (game.board.stones[y][x] > 0) {
        ++counts[game.board.stones[y][x]];
      }
    }
  }
  return counts;
}

function isValidPoint(def, pos) {
  return def.allowedPoints[pos.y] && def.allowedPoints[pos.y][pos.x];
}

function areConnected(def, from, to) {
  var reachablePoints = (def.allowedPoints[from.y] && def.allowedPoints[from.y][from.x]) || [],
      isReachable = false;

  reachablePoints.some(function(point) {
    if (point[0] === to.x && point[1] === to.y) {
      isReachable = true;
      return true;
    }
  });

  return isReachable;
}

function hasJustClosedLine(def, board, pos, playerNumber) {
  return def.lines.some(function(line) {
    var positionIncluded = false;
    return line.every(function(point) {
      if (pos.x === point[0] && pos.y === point[1]) {
        positionIncluded = true;
      }
      return getStone(board, point[0], point[1]) === playerNumber;
    }) && positionIncluded;
  });
}

var gameDef = {
  getDefinition: function(options) {
    return this[options.type];
  },
  // Nine Men's Morris
  9: {
    allowedPoints: {
      "0": { "0":[[6,0], [0,6]], "6":[[0,0], [12,0], [6,2]], "12":[[6,0], [12,6]] },
      "2": { "2":[[6,2], [2,6]], "6":[[2,2], [10,2], [6,0], [6,4]], "10":[[6,2], [10,6]] },
      "4": { "4":[[4,6], [6,4]], "6":[[4,4], [8,4], [6,2]], "8":[[6,4], [8,6]] },
      "6": { "0":[[0,0], [0,12], [2,6]], "2":[[0,6], [4,6], [2,2], [2,10]], "4":[[2,6], [4,4], [4,8]],
             "8":[[8,4], [8,8], [10,6]], "10":[[8,6], [12,6], [10,2], [10,10]], "12":[[12,0], [12,12], [10,6]] },
      "8": { "4":[[4,6], [6,8]], "6":[[4,8], [8,8], [8,10]], "8":[[6,8], [8,6]] },
      "10":{ "2":[[2,6], [6,10]], "6":[[2,10], [10,10], [6,8], [6,12]], "10":[[10,6], [6,10]] },
      "12":{ "0":[[0,6], [6,12]], "6":[[0,12],[12,12], [6,10]], "12":[[6,12], [12,6]] }
    },
    lines: [
      [[0,0], [0,6], [0,12]],
      [[2,2], [2,6], [2,10]],
      [[4,4], [4,6], [4,8]],
      [[6,0], [6,2], [6,4]],
      [[6,8], [6,10], [6,12]],
      [[8,4], [8,6], [8,8]],
      [[10,2], [10,6], [10,10]],
      [[12,0], [12,6], [12,12]],

      [[0,0], [6,0], [12,0]],
      [[2,2], [6,2], [10,2]],
      [[4,4], [6,4], [8,4]],
      [[0,6], [2,6], [4,6]],
      [[8,6], [10,6], [12,6]],
      [[4,8], [6,8], [8,8]],
      [[2,10], [6,10], [10,10]],
      [[0,12], [6,12], [12,12]]
    ],
    minPlayers: 2,
    maxPlayers: 2,
    boardSize: 13,
    newBoard: function() {
      var stones = [];
      for (var x=0; x<13; ++x) {
        stones[x] = [];
      }
      return {
        stones: stones
      };
    },
    onStart: function(game) {
      game.data.phases = ['set', 'set'];
      game.data.stoneCounts = [0,0];
      game.markModified('data');
    },
    calcScore: countStones,
    dataForGameStarted: function(game, events) {
      events.phases = game.data.phases;
    },
    actions: {
      take: function(game, data, cb) {
        var from              = data.from,
            playerNumber      = game.getPlayerPosition(data.user),
            otherPlayerNumber = playerNumber === 1 ? 2 : 1,
            gameEnded         = null,
            stone, removePieces, otherStoneCount;

        if (Array.isArray(from)) {
          from = { x: from[0], y: from[1] };
        }

        if (!from) {
          cb(new Error('ARGUMENT_ERROR'));
        } else if (game.data.takeMode !== playerNumber) {
          cb(new Error('ACTION_NOT_ALLOWED'));
        } else {
          stone = getStone(game.board.stones, from);
          if (!stone || stone === playerNumber) {
            cb(new Error('INVALID_MOVE'));
          } else {
            removePieces = [];
            game.board.stones[from.y][from.x] = 0;
            game.markModified('board');
            removePieces.push(from);

            game.nextTurn();

            otherStoneCount = countStones(game)[otherPlayerNumber];

            if (game.data.phases[otherPlayerNumber-1] === 'move') {
              if (otherStoneCount === 3) {
                game.data.phases[otherPlayerNumber-1] = 'fly';
              }
            } else if (game.data.phases[otherPlayerNumber-1] === 'fly') {
              if (otherStoneCount === 2) {
                gameEnded = { winner: playerNumber };
              }
            }

            game.data.takeMode = false;
            game.markModified('data');

            cb(null, {
              removePieces: removePieces,
              newPlayer   : game.actualPlayer,
              gameEnded   : gameEnded,
              takeMode    : false,
              phases      : game.data.phases
            });
          }
        }
      },
      move: function(game, data, cb) {
        var from         = data.from,
            to           = data.to,
            playerNumber = game.getPlayerPosition(data.user),
            movePieces, closedALine;

        // from and to can be point objects or arrays with 2 numbers
        if (Array.isArray(from)) {
          from = { x: from[0], y: from[1] };
        }
        if (Array.isArray(to)) {
          to = { x: to[0], y: to[1] };
        }

        if (game.data.takeMode || game.data.phases[playerNumber-1] === 'set') {
          cb(new Error('ACTION_NOT_ALLOWED'));
        } else if (!from || !to) {
          cb(new Error('ARGUMENT_ERROR'));
        } else if (getStone(game.board.stones, from) !== playerNumber || getStone(game.board.stones, to)) {
          cb(new Error('INVALID_MOVE'));
        } else if (game.data.phases[playerNumber-1] === 'move' && !areConnected(game.definition, from, to)) {
          cb(new Error('INVALID_MOVE'));
        } else if (!isValidPoint(game.definition, to)) {
          cb(new Error('INVALID_MOVE'));
        } else {
          movePieces = [];
          game.board.stones[to.y][to.x] = playerNumber;
          game.board.stones[from.y][from.x] = 0;
          game.markModified('board');
          movePieces.push({ from: from, to: to });

          closedALine = hasJustClosedLine(game.definition, game.board.stones, to, playerNumber);
          if (closedALine) {
            game.data.takeMode = playerNumber;
            game.markModified('data');
          } else {
            game.nextTurn();
          }

          cb(null, {
            movePieces  : movePieces,
            newPlayer   : game.actualPlayer,
            gameEnded   : null,
            takeMode    : closedALine ? game.actualPlayer : false,
            phases      : game.data.phases
          });
        }
      },
      set: function(game, data, cb) {
        var to           = data.to,
            playerNumber = game.getPlayerPosition(data.user),
            addPieces, closedALine;

        if (Array.isArray(to)) {
          to = { x: to[0], y: to[1] };
        }

        if (game.data.takeMode || game.data.phases[playerNumber-1] !== 'set') {
          cb(new Error('ACTION_NOT_ALLOWED'));
        } else if (!to) {
          cb(new Error('ARGUMENT_ERROR'));
        } else if (!isValidPoint(game.definition, to)) {
          cb(new Error('INVALID_MOVE'));
        } else if (getStone(game.board.stones, to)) {
          cb(new Error('INVALID_MOVE'));
        } else {
          addPieces = [];
          game.board.stones[to.y][to.x] = playerNumber;
          to.player = playerNumber;
          addPieces.push(to);
          game.markModified('board');
          ++game.data.stoneCounts[playerNumber-1];
          game.markModified('data');

          closedALine = hasJustClosedLine(game.definition, game.board.stones, to, playerNumber);
          if (closedALine) {
            game.data.takeMode = playerNumber;
            game.markModified('data');
          } else {
            game.nextTurn();
          }

          if (game.data.stoneCounts[playerNumber-1] === 9) {
            game.data.phases[playerNumber-1] = 'move';
            game.markModified('data');
          }

          cb(null, {
            addPieces : addPieces,
            newPlayer : game.actualPlayer,
            gameEnded : null,
            takeMode  : closedALine ? game.actualPlayer : false,
            phases    : game.data.phases
          });
        }
      }
    }
  }
};
module.exports = gameDef;
