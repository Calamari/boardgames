(function(win, doc, Canvas) {
  "use strict";

  var Field = function(point, board) {
    return {
      getPlayer: function() { return board.get(point.x, point.y); },
      x: point.x,
      y: point.y,
      select: function() {
        board.select(point);
      },
      point: point
    };
  };

  var CanvasBoard = function(container, config, eventHandler) {
    this._container = $(container);
    this._config = config;
    this._canvas = $('<canvas id="game-canvas"></canvas>');
    this._container.append(this._canvas);
    this._handler = eventHandler;
    this._boardSize = config.boardSize;
    this.actualPlayer = config.actualPlayer;
    this.thisPlayerNr = config.thisPlayerNr;
  };

  CanvasBoard.prototype = {
    start: function() {
      this._createCanvas(this._config);
      this._setupObservers();
    },
    updateBoard: function(board) {
      this._board = board;
    },
    isTurn: function() {
      return this.actualPlayer === this.thisPlayerNr;
    },
    get: function(x, y) {
      return this._board[y][x];
    },
    select: function(point) {
      this._selected = point;
    },
    deselect: function() {
      this._selected = null;
    },
    getSelected: function() {
      return this._selected;
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
    _positionToCoords: function(px, py) {
      var cellWidth = this._config.cellWidth;
      return { x: Math.floor(px/cellWidth), y: Math.floor(py/cellWidth) };
    },
    _handleClick: function(point) {
      if (point && this.isTurn()) {
        this._handler.onClick(new Field(point, this));
      }
    },

    draw: function(canvas, context) {
      var self   = this,
          i, cellWidth, y, x;

      context.beginPath();
      for (i = this._boardSize+1; i--;) {
        cellWidth = i * this._config.cellWidth;
        context.moveTo(0, cellWidth);
        context.lineTo(this._boardWidth, cellWidth);
        context.moveTo(cellWidth, 0);
        context.lineTo(cellWidth, this._boardWidth);
      }
      context.stroke();

      // draw pieces
      for (y = this._boardSize; y--;) {
        for (x = this._boardSize; x--;) {
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
    _createCanvas: function(config) {
      var self          = this,
          canvasElement = this._canvas[0],

          boardWidth    = config.cellWidth * this._boardSize,

          canvas = new Canvas(canvasElement.id, 60, function(context, frameDuration, totalDuration, frameNumber) {
            if (this.firstFrame) {
              canvasElement.width = canvasElement.height = boardWidth;
            }
            this.clear();

            self.draw(self, context);
          });

      this._boardWidth = boardWidth;
    }
  };

  win.CanvasBoard = CanvasBoard;
}(window, document, Canvas));
