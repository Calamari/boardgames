(function(win) {
  "use strict";

  var Stone = function(field, paper, player) {
    var stoneSize = field.size/2-2,
        stone = paper.circle(field.size/2 + field.x * field.size+0.5, field.size/2 + field.y * field.size+0.5, stoneSize, stoneSize);

    return {
      getPlayer: function() { return player; },
      x: field.x,
      y: field.y,
      select: function() {
        field.select();
      },
      point: field.point,
      draw: function() {
        stone.attr('fill', player === 1 ? '#fff' : '#000');
        return this;
      },
      element: stone
    };
  };

  win.Stone = Stone;
}(window));
