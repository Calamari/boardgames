(function(win, doc, CanvasBoard) {
  "use strict";

  function getDistance(from, to) {
    if (from === to) {
      return 0;
    }
    var xDistance = Math.abs(Math.abs(from.x) - Math.abs(to.x)),
        yDistance = Math.abs(Math.abs(from.y) - Math.abs(to.y));
    return Math.max(xDistance, yDistance);
  }

  var Game = function(container, config) {
    this._boardSize = config.boardSize;
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
    _eventHandler: function() {
      return {
        onMove: this.move.bind(this)
      };
    },
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
    move: function(from, to) {
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
    },
    _move: function(from, to) {
      this._logger.log('Moved piece');
      this._board[to.y][to.x] = this._board[from.y][from.x];
      this._countPieces();
      // ++this._countPieces;
      // if (this._countPieces === this._boardSize * this._boardSize) {
      //   this._gameEnded();
      // }
    },
    _jump: function(from, to) {
      this._logger.log('Jumped piece');
      this._board[to.y][to.x] = this._board[from.y][from.x];
      this._board[from.y][from.x] = null;
    },
    _captureEnemies: function(x, y) {
      var xi, yi;
      for (xi=-1; xi<=1; ++xi) {
        for (yi=-1; yi<=1; ++yi) {
          if (this._board[yi+y] && this._board[yi+y][xi+x]) {
            this._board[yi+y][xi+x] = this.thisPlayerNr;
          }
        }
      }
    },
    nextPlayer: function() {
      this.actualPlayer = this.actualPlayer === 1 ? 2 : 1;
    }
  };

  win.Game = Game;
}(window, document, CanvasBoard));
