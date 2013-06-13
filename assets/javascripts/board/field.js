(function(win, Stone) {
  "use strict";

  var Field = function(x, y, board, size, paper) {
    var canvasX = x * size+0.5,
        canvasY = y * size+0.5;

    this._board = board;
    this._paper = paper;
    this._rect               = paper.rect(canvasX, canvasY, size, size);
    this._highlight          = paper.rect(canvasX, canvasY, size, size);
    this._interactionRect    = paper.rect(canvasX, canvasY, size, size);
    this._selectionHighlight = paper.rect(canvasX, canvasY, size, size);

    this.size    = size;
    this.point   = { x: x, y: y };
    this.x       = x;
    this.y       = y;
    this.element = this._interactionRect;

    this._selectionHighlight.attr('fill', 'rgba(255,155,0,0.5)').hide();
    this._interactionRect.attr('fill', 'transparent').toFront();
  };

  Field.prototype = {
    getPlayer: function() {
      return this._stone ? this._stone.getPlayer() : 0;
    },
    select: function() {
      this._board.select(this.point);
    },
    draw: function() {
      this._rect.attr('stroke', '#333');
      this._rect.attr('fill', '#060');
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
