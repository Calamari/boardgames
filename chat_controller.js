
module.exports = function(app) {
  var io = require('socket.io').listen(app),
      participants = {};

  function addToChannel(socket, channel) {
    if (!participants[channel]) {
      participants[channel] = [];
    }
    participants[channel].push(socket);
    socket.set('channel', channel);
  }

  function removeFromChannel(socket, channel) {
    if (!participants[channel]) {
      participants[channel] = [];
    } else {
      participants[channel] = participants[channel].filter(function(item) {
        return item !== socket;
      });
    }
    socket.set('channel', null);
  }

  var chat = io
    .of('/chat')
    .on('connection', function (socket) {
      socket.on('to channel', function(data) {
        var channel = data.channel;
        if (!participants[channel]) {
          participants[channel] = [];
        }
        addToChannel(socket, channel);
      });
      socket.on('disconnect', function () {
        socket.get('channel', function(err, channel) {
          removeFromChannel(socket, channel);
        });
      });
      socket.on('message', function (data) {
        if (data.channel) {
          if (participants[data.channel]) {
            participants[data.channel].map(function(s) {
              if (s !== socket) {
                s.emit('message', data);
              }
            });
          }
        } else {
          socket.broadcast.emit('message', data);
        }
      });
    });

  return io;
};
