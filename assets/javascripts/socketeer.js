
(function(win) {
  "use strict";

  var Socketeer = function(socket, socketeerId) {
    this.id = socketeerId;
    this._socket = socket;
    this._onReadyHandlers = [];
    this._initSocket(socket);
  };
  Socketeer.prototype = {
    onReady: function(cb) {
      if (this._ready) {
        cb();
      } else {
        this._onReadyHandlers.push(cb);
      }
    },
    _initSocket: function(socket) {
      var self = this;
      this._socket.emit('socketeer.register', this.id, function(data) {
        self._ready = true;
        self._onReadyHandlers.forEach(function(cb) {
          cb();
        });
      });
      this._socket.on('actions', function(data) {
        console.log('actions are todo in game.js!', data);
      });
    },
    on: function(key, cb) {
      this._socket.on(key, cb);
    },
    emit: function(key, data) {
      this._socket.emit(key, data);
    }
  };

  win.Socketeer = Socketeer;
}(window));
