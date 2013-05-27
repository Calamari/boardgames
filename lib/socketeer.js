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

  // registering a session and add socketeerId to session
  createInstanceForSession: function(session) {
    if (!session.socketeerId) {
       var hash = crypto.createHash('md5');
       hash.update(session.id);
       session.socketeerId = hash.digest('base64');
    }
    if (!this.sockets[session.socketeerId]) {
      this.sockets[session.socketeerId] = {
        instance: new SocketeerInstance(session.socketeerId, socketeer),
        data: {}
      };
    }
    this.sockets[session.socketeerId].session = session;

    return this.sockets[session.socketeerId].instance;
  },

  // assign a socket to socketeer instance
  registerSocket: function(socketeerId, socket) {
    if (this.sockets[socketeerId]) {
      this.sockets[socketeerId].socket = socket;
    } else {
      // TODO: This can be circumvented, if we could fetch session from storage
      socket.emit('socketeer.error', 'RELOAD_BROWSER');
    }
  },

  set: function(socketeerId, key, val) {
    if (this.sockets[socketeerId]) {
      if (val !== undef) {
        this.sockets[socketeerId].data[key] = val;
      } else {
        this.remove(socketeerId, key);
      }
    }
  },

  remove: function(socketeerId, key) {
    if (this.sockets[socketeerId]) {
      delete this.sockets[socketeerId].data[key];
    }
  },

  removeData: function(socketeerId, key) {
    this.sockets[socketeerId].data = {};
  },

  get: function(socketeerId, key) {
    if (this.sockets[socketeerId]) {
      return this.sockets[socketeerId].data[key];
    }
  },

  getSockets: function() {
    return this.sockets;
  },

  getSocket: function(socketId) {
    return this.sockets[socketId];
  },

  // returns an SocketeerInstance for given id
  getInstance: function(socketId) {
    return this.sockets[socketId].instance;
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
    var self = this;
    return this._filters.every(function(filter) {
      return Object.keys(filter).every(function(key) {
        return item.data[key] == filter[key];
      });
    });
  }
};

// Socketeer Instance that is add to the Request
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
  },
  remove: function(key) {
    this.socketeer.remove(this.id, key);
  },
  removeData: function() {
    this.socketeer.removeData(this.id);
  }
};

var socketeer = new Socketeer();

module.exports = socketeer;

// connect-middleware
// use after session is set up
socketeer.connect = function(req, res, next) {
  req.socketeer = socketeer.createInstanceForSession(req.session);
  //TODO: this should be there, but random request like favicon.ico are preventing this
  //req.socketeer.removeData();
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
      socket.socketeerId = socketeerId;
      setupListeners(socket);
      cb(socketeerId);
    });
  });
};
