/*jslint node: true */
"use strict";

var Games = {
  'Multiplication': {
    maxPlayers: 2
  }
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
    get: function(type) {
      return Games[type];
    }
  };
}());

module.exports = GameTypes;
