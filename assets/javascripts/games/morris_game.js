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

  var MorrisGame = function(container, config) {
    Game.call(this, container, config);
  };
  extend(MorrisGame, Game);

  MorrisGame.prototype._createBoard = function(container) {
    var config = $.extend(this._config, {
      morrisType: 9
    });
    this._board = new MorrisBoard(container, config, this._eventHandler());
  };

  MorrisGame.prototype._eventHandler = function() {
    return {
      onClick: function() {}//this.setStone.bind(this)
    };
  };

  win.MorrisGame = MorrisGame;
}(window, document, Game, extend));
