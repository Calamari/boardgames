var Handlebars = require('handlebars'),
    fs         = require('fs'),
    dispatch   = require('dispatch'),
    async      = require('async'),

    undef;

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

// allows to create a function with some before filters
function Action(filters, cb) {
  if (cb === undef) {
    cb = filters;
    filters = [];
  }

  return function(req, res, next) {
    async.applyEach(filters, req, res, function() {
      cb(req, res, next);
    });
  };
}

module.exports = dispatch({
  '/': new Action([redirectIfLogin], function(req, res, next) {
    res.html(templates.index({
      openGames: [],
      waitingGames: [],
      channel: '_free'
    }));
  }),
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
