(function(win, doc, CanvasBoard) {
  'use strict';

  var Score = function(element, names, username) {
    this._element = $(element);
    this._names = names;
    this._username = username;
    this.width = 200;
    this._counters = { 1: 0, 2: 0 };
    this._createHTML();
  };

  Score.prototype = {
    _createHTML: function() {
      var self = this;
      this._names.forEach(function(name, index) {
        var displayName = name === self._username ? 'You' : name;
        self._element.append((index === 0 ? displayName + ' ' : '') + '<span class="' + name + ' player' + index + '"></span>' + (index === 1 ? ' ' + displayName : ''));
      });
    },
    _count: function(board, size) {
      var count = { 1: 0, 2: 0},
          sum   = 0;

      board.forEachField(function(field) {
        if (field.getPlayer()) {
          ++count[field.getPlayer()];
          ++sum;
        }
      });
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
