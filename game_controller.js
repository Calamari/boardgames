
module.exports = function(app) {
  var io = require('socket.io').listen(app);

  var chat = io
    .of('/chat')
    .on('connection', function (socket) {
      console.log("SOCKET", socket);
      socket.on('message', function (data) {
        // pass it on
        // TODO: only to relevant games
        console.log('recieved', 'message', data);
        socket.broadcast.emit('message', data);
      });
    });

  return io;
};
