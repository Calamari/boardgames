
(function(win, doc, Canvas) {
  "use strict";
  var BOARDSIZE = 10,

      Game = function(canvasId, config) {
        this._config = config;
        this._socket = config.socket;
        this.actualPlayer = config.actualPlayer;
        this.thisPlayerNr = config.thisPlayerNr;
        this._initBoard();
        this._createCanvas(canvasId, config);
        this._setupObservers(canvasId);
      };

  Game.prototype = {
    _initBoard: function() {
      this._board = [];
      for (var y = BOARDSIZE; y--;) {
        this._board[y] = [];
        for (var x = BOARDSIZE; x--;) {
          this._board[y][x] = 0;
        }
      }
      this._board[0][0] = 1;
      this._board[9][0] = 1;
      this._board[0][9] = 2;
      this._board[9][9] = 2;
    },
    _setupObservers: function(canvasId) {
      var self = this;
      $('#' + canvasId)
        .on('mousemove', function(event) {
          self._hovered = self._positionToCoords(event.offsetX, event.offsetY);
        })
        .on('mouseout', function(event) {
          self._hovered = null;
        })
        .on('click', function(event) {
          self._handleClick(self._hovered);
        });
    },
    _positionToCoords: function(px, py) {
      var cellWidth = this._config.cellWidth;
      return { x: Math.floor(px/cellWidth), y: Math.floor(py/cellWidth) };
    },
    _handleClick: function(point) {
      if (this.isTurn()) {
        if (this._selected) {
          if (this._selected != point) {
            this._move(this._selected, point);
          }
          this._selected = null;
        } else {
          if (this._board[point.y][point.x] === this.thisPlayerNr) {
            this._selectTile(point);
          }
        }
      }
    },
    _move: function(from, to) {
console.log("move");
    },
    _selectTile: function(point) {
      this._selected = point;
    },
    isTurn: function() {
      return this.actualPlayer === this.thisPlayerNr;
    },
    draw: function(canvas, context) {
      var self      = this;

      context.beginPath();
      for (var i = BOARDSIZE+1; i--;) {
        context.moveTo(0, i*this._config.cellWidth);
        context.lineTo(this._boardWidth, i*this._config.cellWidth);
        context.moveTo(i*this._config.cellWidth, 0);
        context.lineTo(i*this._config.cellWidth, this._boardWidth);
      }
      context.stroke();

      // draw pieces
      for (var y = BOARDSIZE; y--;) {
        for (var x = BOARDSIZE; x--;) {
          if (this._board[y][x]) {
            this._drawPiece(context, x, y, this._board[y][x]);
          }
        }
      }
      if (this._selected) {
        this._drawSelection(context, this._selected.x, this._selected.y);
        this._drawMoveArea(context, this._selected.x, this._selected.y);
      }
      if (this._hovered) {
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
      if (player == 1) {
        context.strokeRect(x * cellWidth + 2, y * cellWidth + 2, tileWidth, tileWidth);
      } else {
        context.fillRect(x * cellWidth + 2, y * cellWidth + 2, tileWidth, tileWidth);
      }
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
