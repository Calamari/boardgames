/*jslint node: true */
"use strict";

var express  = require('express'),
    connect  = require('connect'),
    hbs      = require('express-hbs'),
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
      app          = express()
        //.use(express.compess())
        .use(express.static(__dirname + '/public'))
        .use(require('connect-assets')())
        .use(cookieParser)
        .use(express.session({ store: sessionStore }))
        .use(express.bodyParser())
        .use(passport.initialize())
        .use(passport.session())
        .use(express.csrf())
        .use(connect.query())
        .use(flash())
        .use(socketeer.connect),
      server       = http.createServer(app),
      io           = require('socket.io').listen(server);

  // TODO: use helperContext on connect-assets to get rid of this globals:
  css.root = '/stylesheets';
  js.root  = '/javascripts';

  app.engine('hbs', hbs.express3({
    partialsDir: __dirname + '/views',
    defaultLayout: __dirname + '/views/layouts/website',
    layoutsDir: __dirname + '/views/layouts'
  }));
  app.set('view engine', 'hbs');
  app.set('views', __dirname + '/views');

  // load handlebars helpers
  require('./views/helpers');

  // load all models so they can be used via mongoose.model()
  require('./models/game');
  require('./models/user');

  router(app);

  socketeer.start(io);

  app.socketeer = socketeer;
  app.server = server;
  app.io = io;
  return app;
};
