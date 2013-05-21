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

  var ReversiGame = function(container, config) {
    Game.call(this, container, config);
  };
  extend(ReversiGame, Game);

  ReversiGame.prototype._eventHandler = function() {
    return {
      onClick: this.setStone.bind(this)
    };
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
}(window, document, Game));
