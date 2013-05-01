/*jslint node: true */
"use strict";

var crypto = require('crypto'),
    undef;

var Socketeer = function() {
  // should at some point be saved in a permanent store
  this.sockets   = {};
  this.listeners = [];
};

var SocketeerPromise = function(socketeer) {
  this._socketeer = socketeer;
  this._filters   = [];
};

Socketeer.prototype = {
  on: function(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  },

  where: function(condition) {
    var promise = new SocketeerPromise(this);
    promise.where(condition);
    return promise;
  },

  register: function(session) {
    if (!session.socketeerId) {
       var hash = crypto.createHash('md5');
       hash.update(session.id);
       session.socketeerId = hash.digest('base64');
    }
    if (!this.sockets[session.socketeerId]) {
      this.sockets[session.socketeerId] = {};
    }
    this.sockets[session.socketeerId].session = session;

    return session.socketeerId;
  },

  registerSocket: function(socketeerId, socket) {
    this.sockets[socketeerId].socket = socket;
  },

  set: function(socketeerId, key, val) {
    if (this.sockets[socketeerId]) {
      if (val !== undef) {
        this.sockets[socketeerId][key] = val;
      } else {
        this.remove(socketeerId, key);
      }
    }
  },

  remove: function(socketeerId, key) {
    if (this.sockets[socketeerId]) {
      console.log("delete ", key, "for", socketeerId);
      delete this.sockets[socketeerId][key];
    }
  },

  get: function(socketeerId, key) {
    if (this.sockets[socketeerId]) {
      return this.sockets[socketeerId][key];
    }
  },

  getSockets: function() {
    return this.sockets;
  },

  getSocket: function(socketId) {
    return this.sockets[socketId];
  },

  find: function(id) {
    return this.sockets[id];
  },

  send: function(key, data) {
    var promise = new SocketeerPromise(this);
    promise.send(key, data);
    return promise;
  }
};

SocketeerPromise.prototype = {
  where: function(condition) {
    this._filters.push(condition);
    return this;
  },

  send: function(key, data) {
    var self = this;
    Object.keys(this._socketeer.getSockets()).forEach(function(id) {
      var item = self._socketeer.getSocket(id);
      if (item.socket && self._fitFilters(item)) {
        item.socket.emit(key, data);
      }
    });
    return this;
  },

  _fitFilters: function(item) {
    console.log("filter item:", item);
    var self = this;
    return this._filters.every(function(filter) {
      return Object.keys(filter).every(function(key) {
        return item[key] == filter[key];
      });
    });
  }
};

var SocketeerInstance = function(socketeerId, socketeer) {
  this.id = socketeerId;
  this.socketeer = socketeer;
};

// This is the interface available on every request
SocketeerInstance.prototype = {
  where: function(condition) {
    return this.socketeer.where(condition);
  },
  send: function(key, data) {
    return this.socketeer.send(key, data);
  },
  get: function(key) {
    return this.socketeer.get(this.id, key);
  },
  set: function(key, val) {
    this.socketeer.set(this.id, key, val);
    console.log(this.socketeer.sockets);
  },
  remove: function(key) {
    this.socketeer.remove(this.id, key);
  }
};

var socketeer = new Socketeer();

module.exports = socketeer;
// connect-middleware
socketeer.connect = function(req, res, next) {
  req.socketeerId = socketeer.register(req.session);
  req.socketeer = new SocketeerInstance(req.socketeerId, socketeer);
  next();
};

function setupListeners(socket) {
  Object.keys(socketeer.listeners).forEach(function(type) {
    socketeer.listeners[type].forEach(function(callback) {
      if (type === 'disconnect') {
        // THIS IS NEVER CALLED? :-/
        console.log("disconnect", socket);
        // argument of disconnect will be the userId
        //callback = callback.bind(this, socket.userId);
      }
      socket.on(type, callback);
    });
  });
}

socketeer.start = function(io) {
  io.on('connection', function (socket) {
    socket.on('socketeer.register', function(socketeerId, cb) {
      var socketeerData = socketeer.find(socketeerId);
      socketeer.registerSocket(socketeerId, socket);
      setupListeners(socket);
      cb(socketeerId);
    });
  });
};
