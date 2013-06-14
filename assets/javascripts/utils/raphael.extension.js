Raphael.fn.line = function(startX, startY, endX, endY) {
  return this.path('M' + startX + ' ' + startY + ' L' + endX + ' ' + endY);
};
