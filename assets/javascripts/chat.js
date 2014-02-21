
(function(win, doc, moment) {
  "use strict";
  var Chat = function(element, socket, options) {
    this._username = options.username;
    this._game = options.game;
    this._socket = socket;
    this._channel = options.channel;
    this.$container = $(element);
    this.$content = this.$container.find('.content');
    this._initSocket(socket);
    this._startObservers(this.$container);
    if (options.hideable) {
      this._setupHideable(this.$container);
    }
  };

  Chat.prototype = {
    line: function(msg, who) {
      var className  = this._getClassName(who),
          nameString = className === 'system' ? '' : '<span>' + (className === 'you' ? 'You' : who) + ':</span> ',
          timeString = '<datetime>[' + moment().format('HH:mm') + ']</datetime> ';

      this.$content
        .append('<p class="' + className + '">' + timeString + nameString + msg + '</p>')
        .scrollTop(100000000);
    },
    send: function(msg) {
      this.line(msg, this._username);
      this._socket.emit('message', { message: msg, username: this._username, channel: this._channel });
    },
    _getClassName: function(who) {
      if (!who) {
        return 'system';
      } else if (who === this._username) {
        return 'you';
      } else if (this.isPlayerHandler && this.isPlayerHandler(who)) {
        return 'player';
      }
      return 'someone';
    },
    _initSocket: function(socket) {
      var self = this;
      socket.emit('to channel', { channel: this._channel });
      socket.on('message', function (data) {
        self.line(data.message, data.username);
      });
    },
    _startObservers: function($chatContainer) {
      var self = this,
          $input = $chatContainer.find('input');
      $chatContainer.on('click', function(event) {
        $input.focus();
      });
      $chatContainer.on('keyup', 'input', function(event) {
        if (event.which === 13) {
          self.send(event.target.value);
          event.target.value = '';
        }
      });
    },
    _setupHideable: function _setupHideable($chatContainer) {
      $chatContainer.find('input')
        .on('focus', function() {
          $chatContainer.removeClass('hidden');
        })
        .on('blur', function() {
          $chatContainer.addClass('hidden');
        });
    }
  };

  win.Chat = Chat;
}(window, document, moment));
