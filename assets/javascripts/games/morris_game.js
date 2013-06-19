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
    this._data = config.data;
    if (this._isTaking()) {
      this._logger.log('You build a line, please take a stone of the enemy');
    }
    if (this._isPhase('set')) {
      this._logger.log('You are in set phase.');
    }
    if (this._isPhase('move')) {
      this._logger.log('You are in move phase. Move your stones around to create closed lines.');
    }
    if (this._isPhase('fly')) {
      this._logger.log('You have only three stones left, move your stones around freely');
    }
    // TODO: substiture score with indicator how far we are in set phase
  };
  extend(MorrisGame, Game);

  MorrisGame.prototype._createBoard = function(container) {
    var config = $.extend(this._config, {
      morrisType: 9
    });
    this._board = new MorrisBoard(container, config, this._eventHandler());
  };

  MorrisGame.prototype._updateGame = function(data) {
    var self = this,
        phaseBefore = self._data.phases[this.thisPlayerNr-1],
        key, value;

    for (key in data) {
      value = data[key];

      switch(key) {
        case 'takeMode':
          self._data.takeMode = value;
          if (value === self.thisPlayerNr) {
            self._logger.log('You build a line, please take a stone of the enemy');
          }
          break;
        case 'phases':
          self._data.phases = value;
          if (phaseBefore !== self._data.phases[this.thisPlayerNr-1]) {
            if (this._isPhase('move')) {
              this._logger.log('You are now in move phase. Move your stones around to create closed lines.');
            }
            if (this._isPhase('fly')) {
              this._logger.log('You have only three stones left, move your stones around freely');
            }
          }
          break;
      }
    }

    Game.prototype._updateGame.call(this, data);
  };

  MorrisGame.prototype._eventHandler = function() {
    return {
      onClick: this._clickHandler.bind(this)
    };
  };

  MorrisGame.prototype._clickHandler = function(field) {
    if (this._isTaking()) {
      this.takeStone(field);
    } else if (this._isPhase('set')) {
      this.setStone(field);
    } else {
      this.moveStone(field);
    }
  };

  MorrisGame.prototype._handleSocketResponse = function(data) {
    if (data.error) {
      this._logger.log('ERROR: ' + data.error);
    }
  };

  MorrisGame.prototype.setStone = function(field) {
    if (this._isTurn() && !field.getPlayer()) {
      this._socketeer.emit('action', { action: 'set', to: field.point }, this._handleSocketResponse.bind(this));
    }
  };

  MorrisGame.prototype.takeStone = function(field) {
    if (this._isTurn() && field.getPlayer() && field.getPlayer() !== this.thisPlayerNr) {
      this._socketeer.emit('action', { action: 'take', from: field.point }, this._handleSocketResponse.bind(this));
    }
  };

  MorrisGame.prototype.moveStone = function(field) {
    if (this._isTurn()) {
      var board    = this._board,
          selected = board.getSelected(),
          x        = field.x,
          y        = field.y,
          color, xi, yi, highlightField;

      board.unhighlightAll();
      if (selected) {
        if (!field.getPlayer()) {
          this._move(selected, field);
        }
        board.deselect();
      } else if (field.getPlayer() === this.thisPlayerNr) {
        board.select(field);
        field.highlight();
      }
    }
  };
  MorrisGame.prototype._move = function(from, to) {
    this._socketeer.emit('action', { action: 'move', from: from.point, to: to.point }, this._handleSocketResponse.bind(this));
  };

  MorrisGame.prototype._isPhase = function(phase) {
    return this._data.phases[this.thisPlayerNr-1] === phase;
  };

  MorrisGame.prototype._isTaking = function(phase) {
    return this._data.takeMode === this.thisPlayerNr;
  };

  win.MorrisGame = MorrisGame;
}(window, document, Game, extend));
