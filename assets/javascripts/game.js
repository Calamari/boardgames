(function(win, doc, CanvasBoard) {
  "use strict";

  var Game = function(container, config) {
    this._boardSize = config.boardSize;
    // TODO: make this game specific:
    this._boardEngine = new CanvasBoard(container, config, this._eventHandler());
    this._config = config;
    this._socket = config.socket;
    this._socketeer = new Socketeer(config.socket, config.socketeerId);
    this._logger = config.logger;
    this.isSpectator = config.isSpectator;
    this.actualPlayer = config.actualPlayer;
    this.thisPlayerNr = config.thisPlayerNr;
    this._gameStarted = config.gameStarted;
    this._initBoard(config.stones || []);
    this._initSocketeer();
    this._counters = { 1: $('#counter-1'), 2: $('#counter-2') };
  };

  Game.prototype = {
    _initBoard: function(stones) {
      this._board = [];
      for (var y = this._boardSize; y--;) {
        this._board[y] = [];
        for (var x = this._boardSize; x--;) {
          if (stones[y] && stones[y][x]) {
            this._board[y][x] = stones[y][x];
          } else {
            this._board[y][x] = 0;
          }
        }
      }
      this._boardEngine.updateBoard(this._board);
    },
    _initSocketeer: function() {
      var self = this;
      this._socketeer.onReady(function() {
        if (self._gameStarted) {
          self._startGame();
        } else {
          self._logger.log('Waiting for players');
        }
        self._setupSocketListeners();
      });
    },
    _startGame: function() {
      if (this.isSpectator) {
        this._logger.log('You are just spectating.');
      } else if (this.actualPlayer === this.thisPlayerNr) {
        this._logger.log('It\'s your turn.');
      } else {
        this._logger.log('The other player plays.');
      }
      this._boardEngine.start();
      this._countPieces();
    },
    _endGame: function(winner) {
      if (!this.thisPlayerNr) {
        this._logger.log('Game is over!');
      } else if (this.thisPlayerNr === winner) {
        this._logger.log('You have won! Contrgrats.');
      } else {
        this._logger.log('Sorry, you\'ve lost!');
      }
    },
    _setupSocketListeners: function() {
      var self = this;
      this._socketeer.on('events', function(data) {
        for (var eventType in data) {
          var value = data[eventType];
          switch (eventType) {
            case 'userEntered':
              self._logger.log(value + ' entered the game.');
              break;
            case 'playerJoined':
              self._logger.log(value + ' joined the game.');
              break;
            case 'gameStarted':
              self.actualPlayer = value.actualPlayer;
              self._initBoard(value.stones);
              self._gameStarted = true;
              self._startGame();
              break;
            case 'gameEnded':
              self._endGame(value.winner);
              break;
            case 'update':
              self._updateGame(value);
              break;
          }
        }
      });
      this._socketeer.on('socketeer.error', function(error) {
        self._logger.log('<strong>ERROR: Please reload the browser!</strong>');
      });
    },
    _countPieces: function() {
      var count = { 1: 0, 2: 0},
          x, y;

      for (y = this._boardSize; y--;) {
        for (x = this._boardSize; x--;) {
          if (this._board[y] && this._board[y][x]) {
            ++count[this._board[y][x]];
          }
        }
      }
      this._counters[1].html(count[1]);
      this._counters[2].html(count[2]);
    },
    _updateGame: function(data) {
      var self = this,
          key, value,

          addPieces      = function(piece) {
            self._board[piece.y][piece.x] = piece.player;
          },
          removePieces   = function(piece) {
            self._board[piece.y][piece.x] = 0;
          },
          capturedPieces = function(piece) {
            self._board[piece.y][piece.x] = piece.player;
          };

      for (key in data) {
        value = data[key];

        switch(key) {
          case 'actualPlayer':
          case 'newPlayer':
            this.actualPlayer = value;
            if (this.actualPlayer == this.thisPlayerNr) {
              this._logger.log('It\'s your turn again.');
            }
            this._boardEngine.actualPlayer = value;
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
        }
      }
      this._countPieces();
    },
    nextPlayer: function() {
      this.actualPlayer = this.actualPlayer === 1 ? 2 : 1;
    }
  };

  win.Game = Game;
}(window, document, CanvasBoard));
