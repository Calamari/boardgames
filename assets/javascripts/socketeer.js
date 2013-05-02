
(function(win) {
  "use strict";

  var Socketeer = function(socket, socketeerId) {
    this.id = socketeerId;
    this._reconnectAttempts = 0;
    this._socket = socket;
    this._onReadyHandlers = [];
    this._initSocket();
    this._catchError();
    this._errorRegistered = false;
  };
  Socketeer.prototype = {
    onReady: function(cb) {
      if (this._ready) {
        cb();
      } else {
        this._onReadyHandlers.push(cb);
      }
    },
    _initSocket: function() {
      var self = this;
      this._socket.emit('socketeer.register', this.id, function(data) {
        self._ready = true;
        console.log("socket registered");
        self._onReadyHandlers.forEach(function(cb) {
          cb();
        });
      });
    },
    _catchError: function(key, cb) {
      var self = this;
      this._socket.on('reconnect', function() {
        self._initSocket();
      });
      this._socket.on('socketeer.error', function(data) {
        // TODO: let the game handle this error
        if (!self._errorRegistered) {
          alert('[' + data + '] Connection Problem. Please, try reloading this page. ');
        }
      });
      this._socket.on('reconnecting', function() {
        if (++self._reconnectAttempts === 5) {
          alert('Connection Problems. Please, try reloading this page.');
        }
      });
    },
    on: function(key, cb) {
      this._socket.on(key, cb);
      if (key === 'socketeer.error') {
        this._errorRegistered = true;
      }
    },
    emit: function(key, data, cb) {
      this._socket.emit(key, data, cb);
    }
  };

  win.Socketeer = Socketeer;
}(window));
