
module.exports = function(app) {
  var io = require('socket.io').listen(app);

  io.sockets.on('connection', function (socket) {
    socket.on('chat.message', function (data) {
      // pass it on
      // TODO: only to relevant games
      console.log('recieved', 'chat.message', data);
      socket.broadcast.emit('chat.message', data);
    });
  });

  return io;
};
