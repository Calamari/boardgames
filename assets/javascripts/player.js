(function(win, doc) {
  'use strict';

  var Player = function(name, isRemote) {
    this.name = name;
    this.isRemote = isRemote || false;
  };

  Player.prototype = {
    canPlay: function() {
      return !this.isRemote;
    }
  };

  win.Player = Player;
}(window, document));
