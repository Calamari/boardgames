/* globals Stone, extend */
(function(win, Stone, extend) {
  'use strict';

  var TaflStone = function(paper, player) {
    Stone.call(this, paper, player);
    if (player === '1k') {
      this.type = 'rect';
    }
  };
  extend(TaflStone, Stone);

  win.TaflStone = TaflStone;
}(window, Stone, extend));
