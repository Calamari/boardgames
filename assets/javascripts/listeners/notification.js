(function(io, Notification, globals) {
  "use strict";

  var socketeer = new Socketeer(io.connect('/'), globals.socketeerId);

  socketeer.onReady(function() {
    socketeer.on('notification', function(data) {
      new Notification(data);
    });
  });

}(io, Notification, globals));
