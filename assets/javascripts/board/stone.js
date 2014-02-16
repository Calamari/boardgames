(function(win) {
  'use strict';

  function Stone(paper, player) {
    this.paper = paper;
    this.player = player;

    // could also be rect
    this.type = 'round';
  }

  Stone.prototype.setOnField = function setOnField(field) {
    this.field = field;
    this._createElement();
  };

  Stone.prototype.getPlayer = function getPlayer() {
    return this.player;
  };

  Stone.prototype.select = function select() {
    this.field.select();
  };

  Stone.prototype.move = function move(field) {
    this.setOnField(field);
    var newPosition = this._getDrawingPosition();
    if (this.type === 'rect') {
      this.element.animate({ x: newPosition.x, y: newPosition.y }, 333);
    } else {
      this.element.animate({ cx: newPosition.x, cy: newPosition.y }, 333);
    }
  };

  Stone.prototype._createElement = function _createElement() {
    if (this.element) { return; }

    var point = this._getDrawingPosition(),
        field = this.field,
        stoneSize;

    if (this.type === 'rect') {
      stoneSize = field.size-6;
      this.element = this.paper.rect(point.x, point.y, stoneSize, stoneSize);
    } else {
      stoneSize = field.size/2-2;
      this.element = this.paper.circle(point.x, point.y, stoneSize, stoneSize);
    }
    this.element.attr('fill', parseInt(this.player, 10) === 1 ? '#fff' : '#000');
  };

  Stone.prototype._getDrawingPosition = function() {
    var field = this.field;
    if (this.type === 'rect') {
      return { x: field.x * field.size+3.5, y: field.y * field.size+3.5 };
    } else {
      return { x: field.size/2 + field.x * field.size+0.5, y: field.size/2 + field.y * field.size+0.5 };
    }
  };

  win.Stone = Stone;
}(window));
