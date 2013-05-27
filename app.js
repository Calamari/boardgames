/*jslint node: true */
"use strict";

var connect  = require('connect'),
    quip     = require('quip'),
    http     = require('http'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash    = require('connect-flash'),
    auth     = require('./filters/authentication');

module.exports = function(router, mongoUrl) {
  mongoose.connect(mongoUrl);

  auth.configure();

  var cookieParser = connect.cookieParser('multiplication-game-sess'),
      sessionStore = new (require('connect-mongo')(connect))({
        db: 'boardgames_session_dev'
      }),
      socketeer    = require('./lib/socketeer'),
      app          = connect()
        .use(connect.static(__dirname + '/assets'))
        .use(connect.static(__dirname + '/public'))
        .use(cookieParser)
        .use(connect.session({ store: sessionStore }))
        .use(connect.bodyParser())
        .use(passport.initialize())
        .use(passport.session())
        .use(connect.query())
        .use(flash())
        .use(quip())
        .use(socketeer.connect)
        .use(router),
      server       = http.createServer(app),
      io           = require('socket.io').listen(server);

  socketeer.start(io);

  app.socketeer = socketeer;
  app.server = server;
  app.io = io;
  return app;
};
