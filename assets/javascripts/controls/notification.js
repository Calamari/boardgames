(function(win, $) {
  "use strict";

  var LIST_SELECTOR = '#notifications-list',
      TEMPLATE_SELECTOR = '#notification-template';

  var Notification = function(config) {
    var self = this;
    this.list = $(LIST_SELECTOR);

    this._createElement(config);
    this.element.appendTo(this.list);
    this.element.hide().slideDown('slow');

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
                         .replace('[text]', config.text || '')
                         .replace('[url]', config.url)
                         .replace('[linkText]', config.linkText)
                         .replace('[time]', moment().format('hh:mm:ss'));
      this.element = $(template);
      if (!config.url) {
        this.element.find('.goto').remove();
      }
    },
    close: function() {
      this.element.slideUp('slow');
    }
  };

  win.Notification = Notification;
}(window, jQuery));
