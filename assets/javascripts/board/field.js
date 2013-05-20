(function(win) {
  "use strict";

  var Field = function(x, y, board, size, paper) {
    var canvasX = x * size+0.5,
        canvasY = y * size+0.5,
        rect               = paper.rect(canvasX, canvasY, size, size),
        highlight          = paper.rect(canvasX, canvasY, size, size),
        interactionRect    = paper.rect(canvasX, canvasY, size, size),
        selectionHighlight = paper.rect(canvasX, canvasY, size, size),
        stone;

    selectionHighlight.attr('fill', 'rgba(255,155,0,0.5)').hide();
    interactionRect.attr('fill', 'transparent').toFront();

    function removeStone() {
      if (stone) {
        stone.element.remove();
        stone = null;
      }
    }

    return {
      getPlayer: function() { return stone ? stone.getPlayer() : 0; },
      x: x,
      y: y,
      select: function() {
        board.select(point);
      },
      size: size,
      point: { x: x, y: y },
      draw: function() {
        rect.attr('stroke', '#333');
        rect.attr('fill', '#060');
        return this;
      },
      setStone: function(player) {
        removeStone();
        stone = new Stone(this, paper, player).draw();
        interactionRect.toFront();
      },
      removeStone: removeStone,
      hover: function(val) {
        if (val) {
          selectionHighlight.show();
        } else {
          selectionHighlight.hide();
        }
      },
      highlight: function(color) {
        highlight.attr('fill', color);
        highlight.show();
      },
      unhighlight: function() {
        highlight.hide();
      },
      element: interactionRect
    };
  };

  win.Field = Field;
}(window));
