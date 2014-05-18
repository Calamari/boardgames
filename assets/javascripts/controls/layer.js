// DEPRECATED: Totally Deprecated because of SVGBoard
(function(win, $) {
  "use strict";

  var Layer = function(element, config) {
    this.element = $(element);
    this._config = config;
    //this._wrap = this.element.find('.wrap');
    this.open();
  };

  Layer.prototype = {
    open: function() {
      var self = this;
      this.element.removeClass('is-closed');
      this.element
        .on('click.layer', '.closer, .cancel-link', function(event) {
          event.preventDefault();
          self.close();
        })
        .on('click.layer', '.help-link', function(event) {
          event.preventDefault();
          self.element.toggleClass('is-helping');
        })
        .on('click.layer', '.success-link', function(event) {
          config.onSuccess && config.onSuccess.call(self);
          event.preventDefault();
          self.close();
        });
    },
    close: function() {
      this.element
        .addClass('is-closed')
        .off('.layer');
    }
  };

  win.Layer = Layer;
}(window, jQuery));
