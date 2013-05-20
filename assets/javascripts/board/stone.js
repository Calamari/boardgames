(function(win) {
  "use strict";

  var Stone = function(field, paper, player) {
    var stone = Stone.create(field, paper);

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

  Stone.create = function(field, paper) {
    var stoneSize;

    if (Stone.type === 'rect') {
      stoneSize = field.size-6;
      return paper.rect(field.x * field.size+3.5, field.y * field.size+3.5, stoneSize, stoneSize);
    } else {
      stoneSize = field.size/2-2;
      return paper.circle(field.size/2 + field.x * field.size+0.5, field.size/2 + field.y * field.size+0.5, stoneSize, stoneSize);
    }
  };

  Stone.type == 'round'; // could also be rect

  win.Stone = Stone;
}(window));
