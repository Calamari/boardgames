/*jslint node: true */
'use strict';

var Games = {
  'Multiplication': require('./games/multiplication'),
  'Reversi'       : require('./games/reversi'),
  'Morris'        : require('./games/morris'),
  'Tafl'          : require('./games/tafl')
};

var GameTypes = (function() {
  return {
    count: function() {
      return Object.keys(Games).length;
    },
    list: function() {
      return Object.keys(Games);
    },
    containsType: function(type) {
      return !!Games[type];
    },
    get: function(type, config) {
      return Games[type].getDefinition(config);
    },
    newGame: function(type, config) {
      var Game = require('mongoose').model('Game');
      return new Game({ type: type, config: config });
    },
    newHotseatGame: function(type, config) {
      var Game = require('mongoose').model('Game');
      return new Game({ type: type, config: config, hotseat: true });
    }
  };
}());

module.exports = GameTypes;
