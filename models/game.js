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
};

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;
