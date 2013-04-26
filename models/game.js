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

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;
