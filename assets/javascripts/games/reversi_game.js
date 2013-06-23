(function(win, doc, Game, extend) {
  "use strict";


  // ALMOST SAME AS IN reversi.js IN BE
  function getTrappedLine(board, x, y, actualPlayer, dx, dy) {
    var fields = [],
        field;

    field = board.getField(x, y);
    while (field && field.getPlayer()) {
      if (field.getPlayer() !== actualPlayer) {
        fields.push(fields);
      } else {
        return fields;
      }
      x += dx;
      y += dy;
      field = board.getField(x, y);
    }
    return [];
  }

  // SAME AS IN reversi.js IN BE
  function getTrappedLines(board, x, y, actualPlayer) {
    var trappedLines = [],
        dx, dy, line;

    for (dx=-1; dx <= +1; ++dx) {
      for (dy=-1; dy <= +1; ++dy) {
        if (dx || dy) {
          line = getTrappedLine(board, x+dx, y+dy, actualPlayer, dx, dy, []);
          if (line.length) {
            trappedLines.push(line);
          }
        }
      }
    }
    return trappedLines;
  }


  function getDistance(from, to) {
    if (from === to) {
      return 0;
    }
    var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
        yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
    return Math.max(xDistance, yDistance);
  }

  var ReversiGame = function(container, config) {
    Game.call(this, container, config);
    this._setupPossibleMoves();
  };
  extend(ReversiGame, Game);

  ReversiGame.prototype._eventHandler = function() {
    return {
      onClick: this.setStone.bind(this)
    };
  };
  ReversiGame.prototype._setupPossibleMoves = function() {
    var self   = this,
        config = self._config,
        switcher;
    if (config.possibleMovesSwitch) {
      switcher = $(config.possibleMovesSwitch);
      switcher.on('change', function(event) {
        self.showPossibleMoves = switcher.is(':checked');
        self._showPossibleMoves();
      });
    }
    self.on('change', function() {
      self._showPossibleMoves();
    });
  };
  ReversiGame.prototype._showPossibleMoves = function() {
    var board = this._board,
        possibleFields;
    board.unhighlightAll();
    if (this.showPossibleMoves && this._isTurn()) {
      possibleFields = this.getPossibleFields();

      if (possibleFields.length) {
        possibleFields.forEach(function(field) {
          field.highlight('rgba(255,155,0,.7)');
        });
      }
    }
  };
  ReversiGame.prototype.getPossibleFields = function() {
    var actualPlayer  = this.actualPlayer,
        board         = this._board,
        possibleMoves = [],
        lines;

    board.forEachField(function(field) {
      if (!field.getPlayer()) {
        lines = getTrappedLines(board, field.x, field.y, actualPlayer);
        if (lines.length) {
          possibleMoves.push(field);
        }
      }
    });
    return possibleMoves;
  };
  ReversiGame.prototype.setStone = function(field) {
    if (this._isTurn() && !field.getPlayer()) {
      var self = this;
      // add placing rules here? (would also need revert mechanisms)
//      this._placeStone(field.x, field.y);

      this._socketeer.emit('action', { action: 'set', to: field.point }, function(data) {
        if (data.error) {
          self._logger.log('ERROR: ' + data.error);
        } else {
          self._updateGame(data);
        }
      });
    }
  };
  ReversiGame.prototype._placeStone = function(x, y) {
    this._logger.log('placed stone');
    this._board[y][x] = this.thisPlayerNr;
    this._countPieces();
  };

  win.ReversiGame = ReversiGame;
}(window, document, Game, extend));
