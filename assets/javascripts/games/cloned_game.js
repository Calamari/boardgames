(function(win, doc, Game) {
  "use strict";

  function getDistance(from, to) {
    if (from === to) {
      return 0;
    }
    var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
        yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
    return Math.max(xDistance, yDistance);
  }

  function extend(subClass, superClass) {
    var F = function() {};
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;
  }

  var ClonedGame = function(container, config) {
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
    var board    = this._boardEngine,
        selected = board.getSelected();
    if (selected) {
      this.move(selected, field);
      board.deselect();
    } else {
      if (field.getPlayer() === this.thisPlayerNr) {
        field.select();
      }
    }
  };
  ClonedGame.prototype.move = function(from, to) {
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
          this._board[yi+y][xi+x] = this.thisPlayerNr;
        }
      }
    }
  };

  win.ClonedGame = ClonedGame;
}(window, document, Game));
