(function(win, Field, extend) {
  "use strict";

  var MorrisField = function(x, y, fieldType, board, size, paper) {
//    Field.call(this, x, y, board, size, paper);
    var canvasX = x * size+0.5,
        canvasY = y * size+0.5;

    this._board = board;
    this._paper = paper;
    this._interactionRect    = paper.rect(canvasX, canvasY, size, size).attr('stroke', 'transparent').attr('fill', 'transparent');


    this._fieldType = fieldType;
    this.size    = size;
    this.point   = { x: x, y: y };
    this.x       = x;
    this.y       = y;
    this.element = this._interactionRect;

    this._pointSize = size/5;
    this._drawGrid(paper);

    this._interactionRect.attr('fill', 'red').toFront();
  };
  extend(MorrisField, Field);

  MorrisField.prototype._drawGrid = function(paper) {
    var size        = this.size,
        canvasX     = this.x * size+0.5,
        canvasY     = this.y * size+0.5,
        middleX     = canvasX + size/2,
        middleY     = canvasY + size/2,
        fieldType   = this._fieldType,
        lines       = [];

    // horizonal & vertical
    if (['┏','┌','┬','├','┼','╋','└','┗','┴', '─'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(middleX, middleY, canvasX + size+1, middleY));
    }
    if (['┓','┬','┐','┼','╋','┤','┴','┘','┛', '─'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(canvasX, middleY, middleX, middleY));
    }
    if (['├','┼','╋','┤','└','┗','┴','┘','┛', '│'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(middleX, canvasY, middleX, middleY));
    }
    if (['┓','┏','┌','┬','┐','├','┼','╋','┤', '│'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(middleX, middleY, middleX, canvasY + size+1));
    }

    // diagonal
    if (['┏','╋'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(middleX, middleY, middleX + size+1, middleY + size+1));
    }
    if (['┓','╋'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(middleX, middleY, middleX - size, middleY + size+1));
    }
    if (['┗','╋'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(middleX, middleY, middleX + size+1, middleY - size));
    }
    if (['┛','╋'].indexOf(fieldType) !== -1) {
      lines.push(paper.line(middleX, middleY, middleX - size, middleY - size));
    }

    if (['┓','┏','┌','┬','┐', '├','┼','╋','┤', '└','┗','┴','┘','┛'].indexOf(fieldType) !== -1) {
      this._point = paper.circle(middleX, middleY, this._pointSize).attr('fill', '#000').attr('stroke', 'transparent');
    }
    lines.forEach(function(line) {
      line.attr('stroke', '#000')
          .attr('stroke-width', Math.max(1, size/12));
    });
  };

  MorrisField.prototype.draw = function() {
    return this;
  };

  MorrisField.prototype.hover = function(val) {
    var animOptions;
    if (this._point) {
      if (val) {
        animOptions = { r: this._pointSize*1.5 };
      } else {
        animOptions = { r: this._pointSize };
      }
      this._point.animate(animOptions, 250, 'ease-out');
    }
  };

  win.MorrisField = MorrisField;
}(window, Field, extend));
