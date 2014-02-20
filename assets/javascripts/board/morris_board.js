(function(win, doc, extend, MorrisField) {
  "use strict";


  var Boards = {
    3: {
      size: 3,
      cellWidth: 60,
      layout: [
        '┏┬┓',
        '├╋┤',
        '┗┴┛'
      ]
    },
    6: {
      size: 9,
      cellWidth: 40,
      layout: [
        '┌───┬───┐',
        '│   │   │',
        '│ ┌─┴─┐ │',
        '│ │   │ │',
        '├─┤   ├─┤',
        '│ │   │ │',
        '│ └─┬─┘ │',
        '│   │   │',
        '└───┴───┘'
      ]
    },
    9: {
      size: 13,
      cellWidth: 35,
      layout: [
        '┌─────┬─────┐',
        '│     │     │',
        '│ ┌───┼───┐ │',
        '│ │   │   │ │',
        '│ │ ┌─┴─┐ │ │',
        '│ │ │   │ │ │',
        '├─┼─┤   ├─┼─┤',
        '│ │ │   │ │ │',
        '│ │ └─┬─┘ │ │',
        '│ │   │   │ │',
        '│ └───┼───┘ │',
        '│     │     │',
        '└─────┴─────┘'
      ]
    },
    12: {
      size: 13,
      cellWidth: 35,
      layout: [
        '┏─────┬─────┓',
        '│     │     │',
        '│ ┏───┼───┓ │',
        '│ │   │   │ │',
        '│ │ ┌─┴─┐ │ │',
        '│ │ │   │ │ │',
        '├─┼─┤   ├─┼─┤',
        '│ │ │   │ │ │',
        '│ │ └─┬─┘ │ │',
        '│ │   │   │ │',
        '│ ┗───┼───┛ │',
        '│     │     │',
        '┗─────┴─────┛'
      ]
    }
  };

  var MorrisBoard = function(container, config, eventHandler) {
    this._boardDef = Boards[config.morrisType || 9];
    this._boardSize = this._boardDef.size;
    this._cellWidth = this._boardDef.cellWidth;
    this._container = $(container);
    this._config = config;
    this._showHover = config.showHover;
    this._eventHandler = eventHandler;
    this._fields = [];
    this._createPaper(this._config);
  };
  extend(MorrisBoard, SVGBoard);

  $.extend(MorrisBoard.prototype, {
    _createBoard: function() {
      var self = this,
          boardDef = this._boardDef,
          y, x, field, stone;

      this._boardFields = [];

      // background color
      this._rect= this._paper.rect(0, 0, this._boardSize * this._cellWidth, this._boardSize * this._cellWidth).attr('stroke', '#ba0').attr('fill', '#ba0');

      // draw pieces
      for (y = this._boardSize; y--;) {
        this._boardFields[y] = [];
        for (x = this._boardSize; x--;) {
          field = new MorrisField(x, y, boardDef.layout[y][x], self, this._cellWidth, this._paper);
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
  });

  win.MorrisBoard = MorrisBoard;
}(window, document, extend, MorrisField));
