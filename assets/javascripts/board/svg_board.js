(function(win, doc, Raphael) {
  "use strict";

  var SVGBoard = function(container, config, eventHandler) {
    this._container = $(container);
    this._config = config;
    this._boardSize = config.boardSize;
    this._cellWidth = config.cellWidth;
    this._showHover = config.showHover;
    this._eventHandler = eventHandler;
    this._fields = [];
    this._createPaper(this._config);
  };

  SVGBoard.prototype = {
    start: function() {
    },
    updateBoard: function(stones) {
      // TODO: make this list of stones flat
      var y, x, stone;

      for (y = this._boardSize; y--;) {
        for (x = this._boardSize; x--;) {
          this._boardFields[y][x].removeStone();
          if (stones[y] && stones[y][x]) {
            this._boardFields[y][x].setStone(stones[y][x]);
          }
        }
      }
    },
    showHover: function(value) {
      this._showHover = value;
    },
    forEachField: function(iterator) {
      this._fields.forEach(iterator);
    },
    getField: function(x, y) {
      return this._boardFields[y] && this._boardFields[y][x];
    },
    select: function(field) {
      this._selected = field;
    },
    deselect: function() {
      this._selected = null;
    },
    getSelected: function() {
      return this._selected;
    },
    unhighlightAll: function() {
      this._fields.forEach(function(field) {
        field.unhighlight();
      });
    },
    _handleClick: function(field) {
      this._eventHandler.onClick(field);
    },
    addPiece: function(piece, player) {
      this.getField(piece.x, piece.y).setStone(player || piece.player);
    },
    removePiece: function(piece) {
      this.getField(piece.x, piece.y).removeStone();
    },
    movePiece: function(piece) {
      var player = this.getField(piece.from.x, piece.from.y).getPlayer();
      this.removePiece(piece.from);
      this.addPiece(piece.to, player);
    },

    _createPaper: function(config) {
      var boardWidth = this._cellWidth * this._boardSize + 1;
      this._paper = new Raphael(this._container[0], boardWidth, boardWidth);
      this._createBoard();
    },
    _createBoard: function() {
      var self = this,
          y, x, field, stone;

      this._boardFields = [];

      // draw pieces
      for (y = this._boardSize; y--;) {
        this._boardFields[y] = [];
        for (x = this._boardSize; x--;) {
          field = new Field(x, y, this, this._cellWidth, this._paper);
          this._fields.push(field);
          this._boardFields[y][x] = field;
        }
      }
      this._fields.forEach(function(field) {
        field.element.hover(function() {
          if (self._showHover) {
            this.hover(true);
          }
        }, function() {
          this.hover(false);
        }, field, field);
        field.element.click(function() {
          self._handleClick(field);
        });
      });
    }
  };

  win.SVGBoard = SVGBoard;
}(window, document, Raphael));
