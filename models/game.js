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
    actualPlayer: { 'type': Number },
    log: { 'type': [String] },
    createdAt: { 'type': Date, 'default': Date.now }
});

gameSchema.path('type').validate(function(value) {
  return GameTypes.containsType(value);
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

gameSchema.methods.isPlayersTurn = function(player) {
  var index = typeof player === 'string' ? this.players.indexOf(player)+1 : player;
  return index === this.actualPlayer ? true : false;
};

gameSchema.methods.nextTurn = function(player) {
  ++this.actualPlayer;
  if (this.actualPlayer > GameTypes.get(this.type).maxPlayers) {
    this.actualPlayer = 1;
  }
};

gameSchema.methods.canJoin = function(player) {
  if (!this.started && this.players.length < GameTypes.get(this.type).maxPlayers && !this.getPlayerPosition(player)) {
    return true;
  }
  return false;
};

gameSchema.methods.isReady = function() {
  return this.started || (this.players.length >= GameTypes.get(this.type).minPlayers &&
                          this.players.length <= GameTypes.get(this.type).maxPlayers);
};

gameSchema.methods.action = function(action, data, cb) {
  var self = this;
  GameTypes.get(this.type).actions[action](this, data, function(err, data) {
    if (err) {
      cb(err);
    } else {
      self.save(function(err) {
        cb(err, data);
      });
    }
  });
};


//TODO: tests
gameSchema.statics.findWherePlayerCanJoin = function(username, cb) {
  this.find({ players: { $ne: username }, started: false }, function(err, games) {
    console.log("GAMES", err, games);
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
