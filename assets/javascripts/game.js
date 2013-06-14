(function(win, doc, CanvasBoard, Score) {
  "use strict";

  var Game = function(container, config) {
    this._boardSize = config.boardSize;
    this._config = config;
    this._socket = config.socket;
    this.isSpectator = config.isSpectator;
    this.actualPlayer = config.actualPlayer;
    this.thisPlayerNr = config.thisPlayerNr;
    this._gameStarted = config.gameStarted;
    this._gameEnded = config.gameEnded;
    this._winner = config.winner;
    this._logger = config.logger;

    config.showHover = this._isTurn();
    this._createBoard(container);
    this._socketeer = new Socketeer(config.socket, config.socketeerId);
    this._initSocketeer();
  };

  Game.prototype = {
    _createBoard: function(container) {
      this._board = new SVGBoard(container, this._config, this._eventHandler());
    },
    _initBoard: function(stones) {
      this._board.updateBoard(stones);
      this._score = new Score(this._config.score, this._config.players, this._config.username);
      this._countPieces();
    },
    _initSocketeer: function() {
      var self = this;
      this._socketeer.onReady(function() {
        if (self._socketeerStarted) { return; }
        self._socketeerStarted = true;
        if (self._gameStarted) {
          self._startGame();
        } else {
          self._logger.log('Waiting for players');
        }
        self._setupSocketListeners();
      });
    },
    _startGame: function(stones) {
      if (this._gameEnded) {
        this._endGame(this._winner);
      } else if (this.isSpectator) {
        this._logger.log('You are just spectating.');
      } else if (this.actualPlayer === this.thisPlayerNr) {
        this._logger.log('It\'s your turn.');
      } else {
        this._logger.log('The other player plays.');
      }
      this._initBoard(this._config.stones || stones);
      this._board.start();
      this.fire('change');
    },
    _endGame: function(winner) {
      if (!this.thisPlayerNr) {
        this._logger.log('Game is over!');
      } else if (this.thisPlayerNr === winner) {
        this._logger.log('You have won! Contrgrats.');
      } else {
        if (this.thisPlayerNr === winner) {
          this._logger.log('You have won! Contrgrats.');
        } else {
          this._logger.log('Sorry, you\'ve lost!');
        }
      }
      this._gameEnded = true;
      this._winner = winner;
      this._board.showHover(false);
      this.fire('change');
    },
    _setupSocketListeners: function() {
      var self = this;
      this._socketeer.on('events.' + this._config.gameId, function(data) {
        self._updateGame(data);
      });
      this._socketeer.on('socketeer.error', function(error) {
        self._logger.log('<strong>ERROR: Please reload the browser!</strong>');
      });
    },
    _countPieces: function() {
      if (this._score) { this._score.update(this._board, this._boardSize); }
    },
    _updateGame: function(data) {
      var self = this,
          key, value,

          addPieces      = function(piece) {
            self._board.addPiece(piece);
          },
          removePieces   = function(piece) {
            self._board.removePiece(piece);
          },
          capturedPieces = function(piece) {
            self._board.addPiece(piece);
          };

      for (key in data) {
        value = data[key];
        if (!value) { continue; }

        switch(key) {
          case 'userEntered':
            self._logger.log(value + ' entered the game.');
            break;
          case 'playerJoined':
            self._logger.log(value + ' joined the game.');
            self._config.players.push(value);
            break;
          case 'gameStarted':
            self._setPlayer(value.actualPlayer);
            self._gameStarted = true;
            self._startGame(value.stones);
            break;
          case 'actualPlayer':
          case 'newPlayer':
            self._setPlayer(value);
            break;
          case 'addPieces':
            value.forEach(addPieces);
            break;
          case 'removePieces':
            value.forEach(removePieces);
            break;
          case 'capturedPieces':
            value.forEach(capturedPieces);
            break;
          case 'gameEnded':
            this._endGame(value.winner);
            break;
        }
      }
      this._countPieces();
      this.fire('change');
    },
    _setPlayer: function(player) {
      this.actualPlayer = player;
      if (this.actualPlayer == this.thisPlayerNr) {
        this._logger.log('It\'s your turn again.');
      }
      this._board.showHover(this._isTurn());
      this.fire('change');
    },
    _isTurn: function() {
      return !this._gameEnded && this.actualPlayer === this.thisPlayerNr;
    },
    nextPlayer: function() {
      this.actualPlayer = this.actualPlayer === 1 ? 2 : 1;
    },
    isPlayer: function(name) {
      return this._config.players.indexOf(name) !== -1;
    },
    getWinner: function() {
      return this._config.players[this._winner-1];
    },
    getActualPlayer: function() {
      return this._config.players[this.actualPlayer-1];
    },
    getGameState: function() {
      if (this._gameEnded) { return 'ended'; }
      if (this._gameStarted) { return 'started'; }
      return 'waiting';
    }
  };

  traits.apply(Game.prototype, 'EventEmitter');

  win.Game = Game;
}(window, document, CanvasBoard, Score));
