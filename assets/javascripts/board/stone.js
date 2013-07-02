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
      move: function(field) {
        var newPosition = Stone.getPoint(field);
        if (Stone.type === 'rect') {
          stone.animate({ x: newPosition.x, y: newPosition.y }, 333);
        } else {
          stone.animate({ cx: newPosition.x, cy: newPosition.y }, 333);
        }
      },
      element: stone
    };
  };

  Stone.create = function(field, paper) {
    var point = Stone.getPoint(field),
        stoneSize;

    if (Stone.type === 'rect') {
      stoneSize = field.size-6;
      return paper.rect(point.x, point.y, stoneSize, stoneSize);
    } else {
      stoneSize = field.size/2-2;
      return paper.circle(point.x, point.y, stoneSize, stoneSize);
    }
  };

  Stone.getPoint = function(field) {
    if (Stone.type === 'rect') {
      return { x: field.x * field.size+3.5, y: field.y * field.size+3.5 };
    } else {
      return { x: field.size/2 + field.x * field.size+0.5, y: field.size/2 + field.y * field.size+0.5 };
    }
  };

  Stone.type == 'round'; // could also be rect

  win.Stone = Stone;
}(window));
