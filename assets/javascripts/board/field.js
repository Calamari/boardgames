(function(win, Stone) {
  "use strict";

  var Field = function(x, y, board, size, paper) {
    this._board = board;
    this._paper = paper;

    this.size    = size;
    this.point   = { x: x, y: y };
    this.x       = x;
    this.y       = y;

    this.draw();
    this.element = this._interactionRect;
  };

  Field.prototype = {
    getPlayer: function() {
      return this._stone ? this._stone.getPlayer() : 0;
    },
    select: function() {
      this._board.select(this.point);
    },
    draw: function() {
      var size    = this.size,
          paper   = this._paper,
          canvasX = this.x * size+0.5,
          canvasY = this.y * size+0.5;

      this._rect               = paper.rect(canvasX, canvasY, size, size)
                                      .attr('stroke', '#333')
                                      .attr('fill', '#060');
      this._highlight          = paper.rect(canvasX, canvasY, size, size);
      this._selectionHighlight = paper.rect(canvasX, canvasY, size, size)
                                      .attr('fill', 'rgba(255,155,0,0.5)').hide();
      this._interactionRect    = paper.rect(canvasX, canvasY, size, size)
                                      .attr('fill', 'transparent').toFront();
      return this;
    },
    setStone: function(player) {
      this.removeStone();
      this._stone = new Stone(this, this._paper, player).draw();
      this._interactionRect.toFront();
    },
    removeStone: function() {
      if (this._stone) {
        this._stone.element.remove();
        this._stone = null;
      }
    },
    hover: function(val) {
      if (val) {
        this._selectionHighlight.show();
      } else {
        this._selectionHighlight.hide();
      }
    },
    highlight: function(color) {
      this._highlight.attr('fill', color);
      this._highlight.show();
    },
    unhighlight: function() {
      this._highlight.hide();
    }
  };

  win.Field = Field;
}(window, Stone));
