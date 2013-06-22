// DEPRECATED: Totally Deprecated because of SVGBoard
(function(win, $) {
  "use strict";

  var Layer = function(element, config) {
    this.element = $(element);
    this._config = config;
    //this._wrap = this.element.find('.wrap');

    var self = this;
    this.element
      .on('click', '.closer, .cancel-link', function(event) {
        event.preventDefault();
        self.close();
      })
      .on('click', '.help-link', function(event) {
        event.preventDefault();
        self.element.toggleClass('is-helping');
      });
    this.open();
  };

  Layer.prototype = {
    open: function() {
      this.element.removeClass('is-closed');
    },
    close: function() {
      this.element.addClass('is-closed');
    }
  };

  win.Layer = Layer;
}(window, jQuery));
