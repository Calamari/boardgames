(function(win, Field, extend) {
  "use strict";

  var MorrisField = function(x, y, fieldType, board, size, paper) {
    this._fieldType = fieldType;
    this._pointSize = size/5;
    Field.call(this, x, y, board, size, paper);
  };
  extend(MorrisField, Field);

  MorrisField.prototype.draw = function() {
    var size        = this.size,
        paper       = this._paper,
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
    if (fieldType === '┏') {
      lines.push(paper.line(middleX, middleY, middleX + size*2+1, middleY + size*2+1));
    }
    if (fieldType === '┓') {
      lines.push(paper.line(middleX, middleY, middleX - size*2, middleY + size*2+1));
    }
    if (fieldType === '┗') {
      lines.push(paper.line(middleX, middleY, middleX + size*2+1, middleY - size*2));
    }
    if (fieldType === '┛') {
      lines.push(paper.line(middleX, middleY, middleX - size*2, middleY - size*2));
    }

    if (['┓','┏','┌','┬','┐', '├','┼','╋','┤', '└','┗','┴','┘','┛'].indexOf(fieldType) !== -1) {
      this._point = paper.circle(middleX, middleY, this._pointSize).attr('fill', '#000').attr('stroke', 'transparent');
    }
    lines.forEach(function(line) {
      line.attr('stroke', '#000')
          .attr('stroke-width', Math.max(1, size/12));
    });

    this._interactionRect = paper.rect(canvasX, canvasY, size, size)
                                 .attr('fill', 'transparent')
                                 .attr('stroke', 'transparent').toFront();
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
