/*jslint node: true */
"use strict";

var connect  = require('connect'),
    quip     = require('quip'),
    http     = require('http'),
    mongoose = require('mongoose'),
    flash    = require('connect-flash');

module.exports = function(router, mongoUrl) {
  mongoose.connect(mongoUrl);

  var app     = connect()
        .use(connect.static(__dirname + '/assets'))
        .use(connect.static(__dirname + '/public'))
        .use(connect.cookieParser())
        .use(connect.cookieSession({ secret: 'multiplication-game-sess' }))
        .use(connect.bodyParser())
        .use(connect.query())
        .use(flash())
        .use(quip())
        .use(router),

        server  = http.createServer(app),
        io      = require('socket.io').listen(server);

  app.server = server;
  app.io = io;
  return app;
};
