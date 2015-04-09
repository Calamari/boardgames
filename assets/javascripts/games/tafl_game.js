

// TODOs:
// - The king disappears, but noone has won??


(function(win, doc, Game, extend, TaflStone) {
  "use strict";

  function getDistance(from, to) {
    if (from === to) {
      return 0;
    }
    var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
        yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
    return Math.max(xDistance, yDistance);
  }

  var TaflGame = function(container, config) {
    config.hideScore = true;
    config.StoneClass = TaflStone;
    Game.call(this, container, config);
  };
  extend(TaflGame, Game);

  TaflGame.prototype._eventHandler = function() {
    return {
      onClick: this._clickHandler.bind(this)
    };
  };

  TaflGame.prototype._clickHandler = function(field) {
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
        if (parseInt(field.getPlayer(), 10) === this.actualPlayer) {
          board.select(field);
          highlightField = field;
          highlightField.highlight('rgba(0,155,255,.7)');
          this._getReachableFieldsOf(field).forEach(function(reachableField) {
            reachableField.highlight('rgba(0,255,255,.4)');
          });
        }
      }
    }
  };

  TaflGame.prototype._getReachableFieldsOf = function _getReachableFieldsOf(field) {
    var x = field.x,
        y = field.y,
        board = this._board,
        result = [];

    function goInDir(dir) {
      var xi = dir[0],
          yi = dir[1],
          field = board.getField(x+xi, y+yi);

      if (field && !field.getPlayer()) {
        result.push(field);
        goInDir([xi === 0 ? 0 : xi<0 ? xi-1 : xi+1, yi === 0 ? 0 : yi<0 ? yi-1 : yi+1]);
      }
    }

    [[0,1], [0,-1], [1,0], [-1,0]].forEach(goInDir);

    return result;
  };

  TaflGame.prototype.move = function(from, to) {
    if (parseInt(this._board.getField(from.x, from.y).getPlayer(), 10) === this.actualPlayer && !parseInt(this._board.getField(to.x, to.y).getPlayer(), 10)) {
      var self = this;

      this.nextPlayer();
      this._socketeer.emit('action', { action: 'move', from: from.point, to: to.point }, function(data) {
        if (data.error) {
          new Notification({ title: 'This move is not allowed.' });
          self._setPlayer(data.actualPlayer, !data.error);
        }
      });
    }
  };
  TaflGame.prototype._move = function(from, to) {
    this._logger.log('Moved piece');
    this._board[to.y][to.x] = this._board[from.y][from.x];
    this._countPieces();
  };
  TaflGame.prototype._captureEnemies = function(x, y) {
    var xi, yi;
    for (xi=-1; xi<=1; ++xi) {
      for (yi=-1; yi<=1; ++yi) {
        if (this._board[yi+y] && this._board[yi+y][xi+x]) {
          this._board[yi+y][xi+x] = this.actualPlayer;
        }
      }
    }
  };

  win.TaflGame = TaflGame;
}(window, document, Game, extend, TaflStone));
