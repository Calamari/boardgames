
(function(win, doc, Canvas) {
  "use strict";

  var BOARDSIZE = 8,

      Game = function(canvasId, config) {
        this._canvasId = canvasId;
        this._canvas = $('#' + canvasId);
        this._config = config;
        this._socket = config.socket;
        this._socketeer = new Socketeer(config.socket, config.socketeerId);
        this._logger = config.logger;
        this.isSpectator = config.isSpectator;
        this.actualPlayer = config.actualPlayer;
        this.thisPlayerNr = config.thisPlayerNr;
        this._gameStarted = config.gameStarted;
        this._initBoard(config.stones || []);
        this._initGame(canvasId, config);
        this._counters = { 1: $('#counter-1'), 2: $('#counter-2') };
      };

  function getDistance(from, to) {
    if (from === to) {
      return 0;
    }
    var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
        yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
    return Math.max(xDistance, yDistance);
  }

  Game.prototype = {
    _initBoard: function(stones) {
      this._board = [];
      for (var y = BOARDSIZE; y--;) {
        this._board[y] = [];
        for (var x = BOARDSIZE; x--;) {
          if (stones[y] && stones[y][x]) {
            this._board[y][x] = stones[y][x];
          } else {
            this._board[y][x] = 0;
          }
        }
      }
    },
    _initGame: function(canvasId, config) {
      var self = this;
      this._socketeer.onReady(function() {
        if (self._gameStarted) {
          self._startGame();
        } else {
          self._logger.log('Waiting for players');
        }
        self._setupSocketListeners();
      });
    },
    _startGame: function() {
      if (this.isSpectator) {
        this._logger.log('You are just spectating.');
      } else if (this.actualPlayer === this.thisPlayerNr) {
        this._logger.log('It\'s your turn.');
      } else {
        this._logger.log('The other player plays.');
      }
      this._createCanvas(this._canvasId, this._config);
      this._setupObservers(this._canvasId);
      this._countPieces();
    },
    _endGame: function(winner) {
      if (!this.thisPlayerNr) {
        this._logger.log('Game is over!');
      } else if (this.thisPlayerNr === winner) {
        this._logger.log('You have won! Contrgrats.');
      } else {
        this._logger.log('Sorry, you\'ve lost!');
      }
    },
    _setupSocketListeners: function() {
      var self = this;
      this._socketeer.on('events', function(data) {
        for (var eventType in data) {
          var value = data[eventType];
          switch (eventType) {
            case 'userEntered':
              self._logger.log(value + ' entered the game.');
              break;
            case 'playerJoined':
              self._logger.log(value + ' joined the game.');
              break;
            case 'gameStarted':
              self.actualPlayer = value.actualPlayer;
              self._initBoard(value.stones);
              self._gameStarted = true;
              self._startGame();
              break;
            case 'gameEnded':
              self._endGame(value.winner);
              break;
            case 'update':
              self._updateGame(value);
              break;
          }
        }
      });
      this._socketeer.on('socketeer.error', function(error) {
        self._logger.log('<strong>ERROR: Please reload the browser!</strong>');
      });
    },
    _setupObservers: function() {
      var self   = this,
          offset = this._canvas.offset();
      this._canvas
        .on('mousemove', function(event) {
          self._hovered = self._positionToCoords(event.pageX - offset.left, event.pageY - offset.top);
        })
        .on('mouseout', function(event) {
          self._hovered = null;
        })
        .on('click', function(event) {
          self._handleClick(self._hovered);
        });
    },
    _countPieces: function() {
      var count = { 1: 0, 2: 0},
          x, y;

      for (y = BOARDSIZE; y--;) {
        for (x = BOARDSIZE; x--;) {
          if (this._board[y] && this._board[y][x]) {
            ++count[this._board[y][x]];
          }
        }
      }
      this._counters[1].html(count[1]);
      this._counters[2].html(count[2]);
    },
    _updateGame: function(data) {
      var self = this,
          key, value,

          addPieces      = function(piece) {
            self._board[piece.y][piece.x] = piece.player;
          },
          removePieces   = function(piece) {
            self._board[piece.y][piece.x] = 0;
          },
          capturedPieces = function(piece) {
            self._board[piece.y][piece.x] = piece.player;
          };
      for (key in data) {
        value = data[key];

        switch(key) {
          case 'actualPlayer':
          case 'newPlayer':
            this.actualPlayer = value;
            if (this.actualPlayer == this.thisPlayerNr) {
              this._logger.log('It\'s your turn again.');
            }
            break;
          case 'addPieces':
            value.forEach(addPieces);
            break;
          case 'removePieces':
            value.forEach(removePieces);
            break;
          case 'capturedPieces':
            value.forEach(capturedPieces);
            break;
        }
      }
      this._countPieces();
    },
    _positionToCoords: function(px, py) {
      var cellWidth = this._config.cellWidth;
      return { x: Math.floor(px/cellWidth), y: Math.floor(py/cellWidth) };
    },
    _handleClick: function(point) {
      if (point && this.isTurn()) {
        if (this._selected) {
          if (this._selected != point) {
            this.move(this._selected, point);
          }
          this._selected = null;
        } else {
          if (this._board[point.y][point.x] === this.thisPlayerNr) {
            this._selectTile(point);
          }
        }
      }
    },
    move: function(from, to) {
      if (this._board[from.y][from.x] === this.thisPlayerNr && !this._board[to.y][to.x]) {
        var distance = getDistance(from, to),
            self     = this;

        if (distance === 1 || distance === 2) {
          if (distance === 1) {
            this._move(from, to);
          } else {
            this._jump(from, to);
          }
          this._captureEnemies(to.x, to.y);
          this.nextPlayer();
          this._socketeer.emit('action', { action: 'move', from: from, to: to }, function(data) {
            self._updateGame(data);
          });
        }
      }
    },
    _move: function(from, to) {
      this._logger.log('Moved piece');
      this._board[to.y][to.x] = this._board[from.y][from.x];
      this._countPieces();
      // ++this._countPieces;
      // if (this._countPieces === BOARDSIZE * BOARDSIZE) {
      //   this._gameEnded();
      // }
    },
    _jump: function(from, to) {
      this._logger.log('Jumped piece');
      this._board[to.y][to.x] = this._board[from.y][from.x];
      this._board[from.y][from.x] = null;
    },
    _captureEnemies: function(x, y) {
      var xi, yi;
      for (xi=-1; xi<=1; ++xi) {
        for (yi=-1; yi<=1; ++yi) {
          if (this._board[yi+y] && this._board[yi+y][xi+x]) {
            this._board[yi+y][xi+x] = this.thisPlayerNr;
          }
        }
      }
    },
    nextPlayer: function() {
      this.actualPlayer = this.actualPlayer === 1 ? 2 : 1;
    },
    _selectTile: function(point) {
      this._selected = point;
    },
    isTurn: function() {
      return this.actualPlayer === this.thisPlayerNr;
    },
    draw: function(canvas, context) {
      var self   = this,
          i, cellWidth, y, x;

      context.beginPath();
      for (i = BOARDSIZE+1; i--;) {
        cellWidth = i * this._config.cellWidth;
        context.moveTo(0, cellWidth);
        context.lineTo(this._boardWidth, cellWidth);
        context.moveTo(cellWidth, 0);
        context.lineTo(cellWidth, this._boardWidth);
      }
      context.stroke();

      // draw pieces
      for (y = BOARDSIZE; y--;) {
        for (x = BOARDSIZE; x--;) {
          if (this._board[y][x]) {
            this._drawPiece(context, x, y, this._board[y][x]);
          }
        }
      }
      if (this._selected) {
        this._drawSelection(context, this._selected.x, this._selected.y);
        this._drawMoveArea(context, this._selected.x, this._selected.y);
      }
      if (this._hovered && this.isTurn()) {
        this._drawHover(context, this._hovered.x, this._hovered.y);
      }
    },
    _drawMoveArea: function(context, x, y) {
      var color, xi, yi;
      for (xi=-2; xi<=2; ++xi) {
        for (yi=-2; yi<=2; ++yi) {
          if (this._board[yi+y] && !this._board[yi+y][xi+x]) {
            color = Math.abs(xi) <= 1 && Math.abs(yi) <= 1 ? 'rgba(0,155,255,.7)' : 'rgba(0,155,255,.3)';
            this._drawHighlight(context, xi+x, yi+y, color);
          }
        }
      }
    },
    _drawSelection: function(context, x, y) {
      this._drawHighlight(context, x, y, 'rgba(255,155,0,.5)');
    },
    _drawHover: function(context, x, y) {
      this._drawHighlight(context, x, y, 'rgba(255,255,0,.3)');
    },
    _drawHighlight: function(context, x, y, color) {
      var cellWidth = this._config.cellWidth;
      context.save();
      context.fillStyle = color;
      context.fillRect(x * cellWidth, y * cellWidth, cellWidth, cellWidth);
      context.restore();
    },
    _drawPiece: function(context, x, y, player) {
      var cellWidth = this._config.cellWidth,
          tileWidth = cellWidth - 4;

      context.save();
      if (player == 1) {
        context.strokeRect(x * cellWidth + 3, y * cellWidth + 3, tileWidth-2, tileWidth-2);
        context.fillStyle = '#f7f7f7';
        context.fillRect(x * cellWidth + 3, y * cellWidth + 3, tileWidth-2, tileWidth-2);
        // for circle: context.arc(x * cellWidth + tileWidth/2+2, y * cellWidth + tileWidth/2+2, tileWidth/2-1, 0, Math.PI*2, true);
      } else {
        context.fillRect(x * cellWidth + 2, y * cellWidth + 2, tileWidth, tileWidth);
      }
      context.restore();
    },
    _createCanvas: function(canvasId, config) {
      var self          = this,
          canvasElement = doc.getElementById(canvasId),

          boardWidth    = config.cellWidth * BOARDSIZE,

          canvas = new Canvas(canvasId, 60, function(context, frameDuration, totalDuration, frameNumber) {
            if (this.firstFrame) {
              canvasElement.width = canvasElement.height = boardWidth;
            }
            this.clear();

            self.draw(self, context);
          });

      this._boardWidth = boardWidth;
    }
  };

  win.Game = Game;
}(window, document, Canvas));
