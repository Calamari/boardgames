/*jslint node: true */
"use strict";

var mongoose  = require('mongoose'),

    Mixed     = mongoose.Schema.Types.Mixed,
    GameTypes = require('./game_types'),
    jaz       = require('jaz-toolkit');

var gameSchema = mongoose.Schema({
    players: { 'type': [String] },
    board: { 'type': Mixed, 'default': {} },
    type: { 'type': String, 'required': true },
    started: { 'type': Boolean, 'default': false },
    ended: { 'type': Boolean, 'default': false },
    winner: { 'type': Number },
    actualPlayer: { 'type': Number },
    turns: { 'type': Number, 'default': 0 },
    log: { 'type': [String] },
    createdAt: { 'type': Date, 'default': Date.now },
    startedAt: { 'type': Date },
    endedAt: { 'type': Date }
});

gameSchema.path('type').validate(function(value) {
  return GameTypes.containsType(value);
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

gameSchema.methods.addPlayer = function(playerName) {
  if (this.players.length < GameTypes.get(this.type).maxPlayers && this.players.indexOf(playerName) === -1) {
    this.players.push(playerName);
    return true;
  } else {
    return false;
  }
};

gameSchema.methods.startGame = function() {
  var definition = GameTypes.get(this.type);
  if (this.players.length < definition.minPlayers) {
    return new Error('NOT_ENOUGH_PLAYERS');
  }
  this.board = definition.newBoard(this);
  this.started = true;
  this.actualPlayer = 1;
};

gameSchema.methods.getPlayerPosition = function(playerName) {
  var index = this.players.indexOf(playerName);
  return index === -1 ? false : index+1;
};

gameSchema.methods.getPlayerName = function(playerPos) {
  return (playerPos >= 1 && playerPos <= this.players.length) ? this.players[playerPos-1] : null;
};

gameSchema.methods.isPlayersTurn = function(player) {
  var index = typeof player === 'string' ? this.players.indexOf(player)+1 : player;
  return index === this.actualPlayer ? true : false;
};

gameSchema.methods.nextTurn = function(player) {
  ++this.actualPlayer;
  ++this.turns;
  if (this.actualPlayer > GameTypes.get(this.type).maxPlayers) {
    this.actualPlayer = 1;
  }
};

gameSchema.methods.canJoin = function(player) {
  if (!this.started && this.players.length < GameTypes.get(this.type).maxPlayers && !this.isPlayer(player)) {
    return true;
  }
  return false;
};

gameSchema.methods.actualPlayerName = function() {
  return this.players[this.actualPlayer-1];
};

gameSchema.methods.isPlayer = function(player) {
  return !!this.getPlayerPosition(player);
};

gameSchema.methods.isReady = function() {
  return this.started || (this.players.length >= GameTypes.get(this.type).minPlayers &&
                          this.players.length <= GameTypes.get(this.type).maxPlayers);
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
    GameTypes.get(this.type).actions[action](this, data, function(err, data) {
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

gameSchema.methods.giveUp = function(player) {
  if (typeof player === 'number') {
    player = this.players[player-1];
  }
  this.endGame(this.players[0] === player ? this.players[1] : this.players[0]);
};

gameSchema.methods.endGame = function(winner) {
  this.ended = true;
  this.endedAt = Date.now();
  this.winner = typeof winner === 'number' ? winner : this.players.indexOf(winner) + 1;
  // TODO: add statistics to user
};


//TODO: tests
gameSchema.statics.findWherePlayerCanJoin = function(username, cb) {
  this.find({ players: { $ne: username }, started: false }, function(err, games) {
    if (err) {
      cb(err);
    } else {
      cb(null, games.filter(function(game) {
        return game.players.length < GameTypes.get(game.type).maxPlayers;
      }));
    }
  });
};

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;
