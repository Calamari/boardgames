var Handlebars = require('handlebars'),
    fs         = require('fs'),
    dispatch   = require('dispatch');

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

module.exports = dispatch({
  '/': function(req, res, next) {
    console.log(req.query);
    res.html(templates.index({ channel: req.query.game || '_free' }));
  }
});
