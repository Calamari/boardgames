(function(win, doc, Game, extend) {
  "use strict";

  function getDistance(from, to) {
    if (from === to) {
      return 0;
    }
    var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
        yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
    return Math.max(xDistance, yDistance);
  }

  var ClonedGame = function(container, config) {
    Stone.type = 'rect';
    Game.call(this, container, config);
  };
  extend(ClonedGame, Game);

  ClonedGame.prototype._eventHandler = function() {
    return {
      onClick: this._clickHandler.bind(this)
    };
  };
  // TODO: move this to game and make this behavior configurable
  ClonedGame.prototype._clickHandler = function(field) {
    if (this._isTurn()) {
      var board    = this._board,
          selected = board.getSelected(),
          x        = field.x,
          y        = field.y,
          color, xi, yi, highlightField;

      board.unhighlightAll();
      if (selected) {
        this.move(selected, field);
        board.deselect();
      } else {
        if (field.getPlayer() === this.actualPlayer) {
          board.select(field);
          for (xi=-2; xi<=2; ++xi) {
            for (yi=-2; yi<=2; ++yi) {
              highlightField = board.getField(xi+x, yi+y);
              if (highlightField && !highlightField.getPlayer()) {
                color = Math.abs(xi) <= 1 && Math.abs(yi) <= 1 ? 'rgba(0,155,255,.7)' : 'rgba(0,155,255,.3)';
                highlightField.highlight(color);
              }
            }
          }
        }
      }
    }
  };
  ClonedGame.prototype.move = function(from, to) {
    if (this._board.getField(from.x, from.y).getPlayer() === this.actualPlayer && !this._board.getField(to.x, to.y).getPlayer()) {
      var distance = getDistance(from, to),
          self     = this;

      if (distance === 1 || distance === 2) {
        // if (distance === 1) {
        //   this._move(from, to);
        // } else {
        //   this._jump(from, to);
        // }
        // this._captureEnemies(to.x, to.y);
        this.nextPlayer();
        this._socketeer.emit('action', { action: 'move', from: from.point, to: to.point }, function(data) {
          if (data.error) {
            self._logger.log('ERROR: ' + data.error);
          }
      //    self._updateGame(data);
        });
      }
    }
  };
  ClonedGame.prototype._move = function(from, to) {
    this._logger.log('Moved piece');
    this._board[to.y][to.x] = this._board[from.y][from.x];
    this._countPieces();
  };
  ClonedGame.prototype._jump = function(from, to) {
    this._logger.log('Jumped piece');
    this._board[to.y][to.x] = this._board[from.y][from.x];
    this._board[from.y][from.x] = null;
  };
  ClonedGame.prototype._captureEnemies = function(x, y) {
    var xi, yi;
    for (xi=-1; xi<=1; ++xi) {
      for (yi=-1; yi<=1; ++yi) {
        if (this._board[yi+y] && this._board[yi+y][xi+x]) {
          this._board[yi+y][xi+x] = this.actualPlayer;
        }
      }
    }
  };

  win.ClonedGame = ClonedGame;
}(window, document, Game, extend));
