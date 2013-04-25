/*jslint node: true */
"use strict";

module.exports = {
  minPlayers: 2,
  maxPlayers: 2,
  newBoard: function() {
    var stones = [];
    for (var x=0; x<8; ++x) {
      stones[x] = [];
    }
    stones[0][0] = 1;
    stones[7][0] = 1;
    stones[0][7] = 2;
    stones[7][7] = 2;
    return {
      stones: stones
    };
  }
};
