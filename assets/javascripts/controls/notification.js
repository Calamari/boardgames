(function(win, $) {
  "use strict";

  var LIST_SELECTOR = '#notifications-list',
      TEMPLATE_SELECTOR = '#notification-template';

  var Notification = function(config) {
    var self = this;
    this.list = $(LIST_SELECTOR);

    this._createElement(config);
    this.element.appendTo(this.list);

    setTimeout(function() {
      self.close();
    }, 5000);
    this.element.on('click', '.closer', function(event) {
      event.preventDefault();
      self.close();
    });
  };

  Notification.prototype = {
    _createElement: function(config) {
      var template = $(TEMPLATE_SELECTOR).html();
      console.log(template, config);
      template = template.replace('[title]', config.title)
                         .replace('[text]', config.text)
                         .replace('[url]', config.url)
                         .replace('[linkText]', config.linkText);
      this.element = $(template);
    },
    close: function() {
      this.element.slideUp('slow');
    }
  };

  win.Notification = Notification;
}(window, jQuery));
