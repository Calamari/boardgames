
(function(win, doc, moment) {
  "use strict";
  var Chat = function(element, socket, options) {
        this._socket = socket;
        this._channel = options.channel;
        this.$container = $(element);
        this.$content = this.$container.find('.content');
        this._initSocket(socket);
        this._startObservers(this.$container);
      };

  Chat.prototype = {
    line: function(msg, who) {
      var now = moment();
      this.$content
        .append('<p class="' + who + '"><span>[' + now.format('HH:mm') + ']</span> ' + msg + '</p>')
        .scrollTop(100000000);
    },
    _initSocket: function(socket) {
      var self = this;
      socket.emit('to channel', { channel: this._channel });
      socket.on('message', function (data) {
        self.line(data.message, 'enemy');
      });
    },
    send: function(msg) {
      this.line(msg, 'you');
      this._socket.emit('message', { message: msg, channel: this._channel });
    },
    _startObservers: function($chatContainer) {
      var self = this;
      $chatContainer.on('keyup', 'input', function(event) {
        if (event.which === 13) {
          self.send(event.target.value);
          event.target.value = '';
        }
      });
    }
  };

  win.Chat = Chat;
}(window, document, moment));
