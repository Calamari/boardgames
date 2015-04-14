/*jslint node: true */
"use strict";

var mongoose  = require('mongoose'),
    async     = require('async'),

    Mixed     = mongoose.Schema.Types.Mixed,
    GameTypes = require('./game_types'),
    jaz       = require('jaz-toolkit');

var gameSchema = mongoose.Schema({
    players: { 'type': [String] },                   // name IDs of players
    score: { 'type': [Number] },                     // the actual score of each player
    board: { 'type': Mixed, 'default': {} },         // data about the current board
    type: { 'type': String, 'required': true },      // which type of game it is
    hotseat: { 'type': Boolean, 'default': false },  // Indicator if this game is a hotseat game (2 player on 1 screen)
    config: { 'type': Mixed, 'default': {} },        // contains game options like which kind of morris game
    data: { 'type': Mixed, 'default': {} },          // contains additional data about the game
    started: { 'type': Boolean, 'default': false },  // is game started?
    ended: { 'type': Boolean, 'default': false },    // is game ended?
    winner: { 'type': Number },                      // indiciates who one (in not zero player number)
    actualPlayer: { 'type': Number },                // who's turn is it (in not zero player number)
    turns: { 'type': Number, 'default': 0 },         // how many turns have been played
    log: { 'type': [Mixed] },                        // some log messages (name is mandatory, can have additional keys)
    createdAt: { 'type': Date, 'default': Date.now },// when was the game created
    startedAt: { 'type': Date },                     // when did the game start
    endedAt: { 'type': Date }                        // when did the game end
});

gameSchema.pre('save', function(next) {
  if (this.started && this.definition.calcScore) {
    var score = this.definition.calcScore(this);
    this.score = [score['1'], score['2']];
  }
  next();
});

gameSchema.path('type').validate(function(value) {
  return GameTypes.containsType(value);
});

gameSchema.virtual('owner').get(function () {
  return this.players[0];
});

gameSchema.virtual('winnerName').get(function () {
  if (this.ended) {
    return this.players[this.winner-1];
  }
  return null;
});

gameSchema.virtual('looserNames').get(function () {
  if (this.ended) {
    var winner = this.winnerName;
    return this.players.filter(function(name) { return name !== winner; });
  }
  return null;
});

gameSchema.virtual('definition').get(function () {
  // TODO: maybe cache gametype on instance
  return GameTypes.get(this.type, this.config);
});

// Return the position of the next player
// (BEWARE: this assumes only 2 Player games right now)
gameSchema.virtual('nextPlayerPosition').get(function () {
  return this.actualPlayer === 1 ? 2 : 1;
});

gameSchema.methods.addPlayer = function(playerName) {
  if (this.players.length < this.definition.maxPlayers && this.players.indexOf(playerName) === -1) {
    this.players.push(playerName);
    this.addToLog('join', this.players.length, { playerName: playerName });
    return true;
  } else {
    return false;
  }
};

gameSchema.methods.startGame = function(cb) {
  var definition = this.definition,
      User       = mongoose.model('User'),
      self       = this,
      error;

  if (this.hotseat) {
    // Hotseat games need on player and will be filled up with this player
    if (this.players.length < 1) {
      error = new Error('NOT_ENOUGH_PLAYERS')
      cb && cb(error);
      return error;
    } else {
      // Fill up the game with the same player
      for (var i = definition.minPlayers - this.players.length; i--;) {
        this.players.push(this.players[0]);
      }
    }
  }
  if (this.players.length < definition.minPlayers) {
    error = new Error('NOT_ENOUGH_PLAYERS')
    cb && cb(error);
    return error;
  }
  this.board = definition.newBoard(this);
  definition.onStart(this);
  this.started = true;
  this.actualPlayer = 1;
  User.findOne({ username: this.players[0] }, function(err, user) {
    if (err) { return cb && cb(err); }
    if (!user) { return cb && cb(new Error('User starting the game ' + self._id + ' not found.')); }
    user.statistics.increment( self.hotseat ? 'hotseatGamesStarted' : 'gamesStarted');
    user.save(cb);
  });
};

gameSchema.methods.scoreOf = function(playerName) {
  return this.score[this.getPlayerPosition(playerName)-1];
};

// DEPRECATED: actualPlayer should be used instead
gameSchema.methods.getPlayerPosition = function(playerName) {
  var index = this.players.indexOf(playerName);
  return index === -1 ? false : index+1;
};

gameSchema.methods.getPlayerName = function(playerPos) {
  return (playerPos >= 1 && playerPos <= this.players.length) ? this.players[playerPos-1] : null;
};

gameSchema.methods.isPlayersTurn = function(player) {
  if (this.hotseat) { return true; }
  var index = typeof player === 'string' ? this.players.indexOf(player)+1 : player;
  return index === this.actualPlayer ? true : false;
};

gameSchema.methods.nextTurn = function(player) {
  ++this.actualPlayer;
  ++this.turns;
  if (this.actualPlayer > this.definition.maxPlayers) {
    this.actualPlayer = 1;
  }
};

gameSchema.methods.canJoin = function(player) {
  return !this.started && this.players.length < this.definition.maxPlayers && !this.isPlayer(player);
};

gameSchema.methods.canGiveUp = function(player) {
  return this.started && !this.ended && this.isPlayer(player);
};

gameSchema.methods.canCancel = function(player) {
  return !this.started && this.owner === player;
};

gameSchema.methods.canDelete = function(player) {
  return this.hotseat && this.owner === player;
};

gameSchema.methods.getOpponents = function(playerName) {
  return this.players.filter(function(name) {
    return name !== playerName;
  });
};

gameSchema.methods.actualPlayerName = function() {
  return this.players[this.actualPlayer-1];
};

gameSchema.methods.isPlayer = function(player) {
  return !!this.getPlayerPosition(player);
};

gameSchema.methods.isReady = function() {
  return this.started || (this.players.length >= this.definition.minPlayers &&
                          this.players.length <= this.definition.maxPlayers);
};

gameSchema.methods.action = function(action, data, cb) {
  var game         = this,
      playerNumber = game.getPlayerPosition(data.user);

  if (!game.started) {
    cb(new Error('GAME_NOT_STARTED'));
  } else if (game.ended) {
    cb(new Error('GAME_ALREADY_ENDED'));
  } else if (!game.isPlayersTurn(playerNumber)) {
    cb(new Error('NOT_YOUR_TURN'));
  } else {
    this.definition.actions[action](this, data, function(err, data) {
      if (err) {
        cb(err);
      } else {
        game.save(function(err) {
          cb(err, data);
        });
      }
    });
  }
};

gameSchema.methods.addToLog = function addToLog(name, player, data) {
  data = data || {};
  data.name = name;
  data.player = player;
  this.log.push(data);
};

gameSchema.methods.giveUp = function(player) {
  if (typeof player === 'number') {
    player = this.players[player-1];
  }
  this.addToLog('giveUp', this.players.indexOf(player)+1);
  this.endGame(this.players[0] === player ? this.players[1] : this.players[0]);
};

gameSchema.methods.endGame = function(winner) {
  var game = this,
      User = require('./user'),
      called = false;
  this.ended = true;
  this.endedAt = Date.now();
  this.winner = typeof winner === 'number' ? winner : this.players.indexOf(winner) + 1;
  this.addToLog('win', this.winner);

  if (!this.hotseat) {
    this.pre('save', function(done) {
      if (called) { return done(); }
      called = true;

      async.parallel([
        function(cb) {
          User.incrementStats({ username: game.winnerName }, 'gamesWon', cb);
        },
        function(cb) {
          User.incrementStats({ username: { $in: game.looserNames } }, 'gamesLost', cb);
        }
      ], done);
    });
  }
};

gameSchema.methods.dataForGameStarted = function(events) {
  if (this.definition.dataForGameStarted) {
    this.definition.dataForGameStarted(this, events);
  }
};

gameSchema.statics.createGame = function createGame(type,config) {
  return GameTypes.newGame(type, config);
};

//TODO: tests
gameSchema.statics.findWherePlayerCanJoin = function(username, cb) {
  this.find({ players: { $ne: username }, started: false, hotseat: false }, function(err, games) {
    if (err) {
      cb(err);
    } else {
      cb(null, games.filter(function(game) {
        return game.players.length < game.definition.maxPlayers;
      }));
    }
  });
};

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;
