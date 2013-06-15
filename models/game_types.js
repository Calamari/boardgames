/*jslint node: true */
"use strict";

var Games = {
  'Multiplication': require('./games/multiplication'),
  'Reversi'       : require('./games/reversi'),
  'Morris'        : require('./games/morris')
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
    }
  };
}());

module.exports = GameTypes;
