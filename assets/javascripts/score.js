(function(win, doc, CanvasBoard) {
  'use strict';

  var Score = function(element, names) {
    this._element = $(element);
    this._names = names;
    this.width = 200;
    this._counters = { 1: 0, 2: 0 };
    this._createHTML();
  };

  Score.prototype = {
    _createHTML: function() {
      var self = this;
      this._names.forEach(function(name, index) {
        self._element.append((index === 0 ? name + ' ' : '') + '<span class="' + name + ' player' + index + '"></span>' + (index === 1 ? ' ' + name : ''));
      });
    },
    _count: function(board, size) {
      var count = { 1: 0, 2: 0},
          sum   = 0,
          x, y;

      for (y = size; y--;) {
        for (x = size; x--;) {
          if (board[y] && board[y][x]) {
            ++count[board[y][x]];
            ++sum;
          }
        }
      }
      this._counters = count;
      return sum;
    },
    update: function(board, size) {
      var sum  = this._count(board, size),
          self = this;

      this._names.forEach(function(name, index) {
        var count = self._counters[index+1],
            size  = (sum > 0) ? (count / sum) * self.width : self.width / self._names.length;
        self._element.find('.' + name).css({ width: size }).html(count);
      });
    }
  };

  win.Score = Score;
}(window, document, CanvasBoard));
