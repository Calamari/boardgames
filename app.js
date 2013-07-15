/*jslint node: true */
'use strict';

var express  = require('express'),
    connect  = require('connect'),
    hbs      = require('express-hbs'),
    http     = require('http'),
    fs       = require('fs'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    auth     = require('./filters/authentication');

module.exports = function(router, mongoUrl, config) {
  mongoose.connect(mongoUrl + config.dbPostfix);

  auth.configure();

  var cookieParser = connect.cookieParser('multiplication-game-sess'),
      sessionStore = new (require('connect-mongo')(connect))({
        db: 'boardgames_session_' + config.dbPostfix
      }),
      socketeer    = require('./lib/socketeer'),
      app          = express()
        //.use(express.compess())
        .use(express.static(__dirname + '/public'))
        .use(require('connect-assets')())
        .use(cookieParser)
        .use(express.session({ store: sessionStore }))
        .use(express.bodyParser())
        .use(express.methodOverride())
        .use(passport.initialize())
        .use(passport.session())
        .use(connect.query())
        .use(socketeer.connect),
      server       = http.createServer(app),
      io           = require('socket.io').listen(server),

      initializers = fs.readdirSync(__dirname + '/config/initializers');

  initializers.forEach(function(filename) {
    require(__dirname + '/config/initializers/' + filename)(app);
  });

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
  fs.readdirSync(__dirname + '/views/helpers/').forEach(function(filename) {
    require(__dirname + '/views/helpers/' + filename);
  });

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
