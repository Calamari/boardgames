(function(win, doc, Raphael) {
  "use strict";

  var SVGBoard = function(container, config, clickHandler) {
    this._container = $(container);
    this._config = config;
    this._boardSize = config.boardSize;
    this._clickHandler = clickHandler;
    this._fields = [];
    this._createPaper(this._config);
    this.actualPlayer = config.actualPlayer;
    this.thisPlayerNr = config.thisPlayerNr;
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
    isTurn: function() {
      // This is game logic and does not belong here
      return this.actualPlayer === this.thisPlayerNr;
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
      if (this.isTurn()) {
        this._clickHandler.onClick(field);
      }
    },
    addPiece: function(piece) {
      this.getField(piece.x, piece.y).setStone(piece.player);
    },
    removePiece: function(piece) {
      this.getField(piece.x, piece.y).removeStone();
    },

    _createPaper: function(config) {
      var boardWidth = config.cellWidth * this._boardSize + 1;
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
          field = new Field(x, y, this, this._config.cellWidth, this._paper).draw();
          this._fields.push(field);
          this._boardFields[y][x] = field;
        }
      }
      this._fields.forEach(function(field) {
        field.element.hover(function() {
          if (self.isTurn()) {
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
