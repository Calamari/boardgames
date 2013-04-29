var Handlebars = require('handlebars'),
    fs         = require('fs'),
    dispatch   = require('dispatch'),
    async      = require('async'),
    mongoose   = require('mongoose'),

    undef;

require('./models/game');

// TODO: this could be exportet in an node module:
var templates = [];

templates.load = function(filename) {
  return Handlebars.compile(fs.readFileSync(filename).toString());
};

fs.readdirSync(__dirname + '/views').forEach(function(file) {
  var filename = __dirname + '/views/' + file,
      name     = file.replace('.hbs', '');

  templates[name] = templates.load(filename);
  fs.watch(filename, function reloadTemplate(event) {
    templates[name] = templates.load(filename);
  });
});

function redirectIfLogin(req, res, next) {
  if (req.session.username) {
    next();
  } else {
    res.redirect('/login');
  }
}

function gamesOfPlayer(req, res, next) {
  var Game     = mongoose.model('Game'),
      username = req.session.username;

  Game.find({ 'players': username }, function(err, games) {
    if (!err) {
      req.runningGames = games.filter(function(game) {
        return game.started;
      });
      req.waitingGames = games.filter(function(game) {
        return !game.started;
      });
    }
    Game.findWherePlayerCanJoin(username, function(err, games) {
      if (!err) {
        req.openGames = games;
      }
      next();
    });
  });
}

function loadGameOr404(req, res, next, id) {
  var Game = mongoose.model('Game');

  Game.findById(id, function(err, game) {
    if (err) {
      res.notFound('404');
    } else {
      req.game = game;
      next();
    }
  });
}

// allows to create a function with some before filters
function Action(filters, cb) {
  if (cb === undef) {
    cb = filters;
    filters = [];
  }

  return function(req, res, next) {
    var args = arguments;
    async.applyEach(filters, req, res, function() {
      cb.apply(this, args);
    });
  };
}

module.exports = dispatch({
  '/': new Action([redirectIfLogin, gamesOfPlayer], function(req, res, next) {
    res.html(templates.index({
      errorMessage: req.flash('error'),
      username: req.session.username,
      openGames: req.openGames,
      runningGames: req.runningGames,
      waitingGames: req.waitingGames,
      channel: '_free'
    }));
  }),
  '/game': {
    '/:id': new Action([redirectIfLogin], function(req, res, next, id) {
      loadGameOr404(req, res, function() {
        req.socketeer.set('gameId', req.game.id);
        req.socketeer.where({ gameId: req.game.id }).send('events', { userEntered: req.session.username });
        res.html(templates.game({ game: req.game, socketeerId: req.socketeerId }));
      }, id);
    }),
    '/:id/join': new Action([redirectIfLogin], function(req, res, next, id) {
      loadGameOr404(req, res, function() {
        if (req.game.canJoin(req.session.username)) {
          req.game.addPlayer(req.session.username);
          if (req.game.isReady()) {
            req.game.startGame();
            req.socketeer.where({ gameId: req.game.id }).send('actions', { gameStarted: true });
          }
          req.game.save(function(err) {
            if (err) { req.flash('error', 'You can not join this game.'); }
            res.redirect('/game/' + req.game.id);
          });
        } else {
          req.flash('error', 'You can not join this game.');
          res.redirect('/game/' + req.game.id);
        }
      }, id);
    }),
    '/:type/new': new Action([redirectIfLogin], function(req, res, next, type) {
      var Game = mongoose.model('Game'),
          game = new Game({ type: 'Multiplication'});

      game.addPlayer(req.session.username);
      game.save(function(err) {
        if (err) {
          req.flash('error', 'Game could not be created.');
          res.redirect('/');
        } else {
          res.redirect('/game/' + game.id);
        }
      });
    })
  },
  '/login': {
    GET: new Action(function(req, res, next) {
      res.html(templates.login({}));
    }),
    POST: new Action(function(req, res, next) {
      var username = req.body.username.trim();

      if (username) {
        req.session.username = username;
        res.redirect('/');
      } else {
        res.html(templates.login({ error: 'Enter a name!' }));
      }
    })
  },
  '/logout': new Action(function(req, res, next) {
    delete req.session.username;
    res.redirect('/login');
  })
});
