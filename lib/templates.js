/*jslint node: true */
"use strict";

// This could be exportet in an node module?

var Handlebars = require('handlebars'),
    fs         = require('fs'),

    templates  = [];

// load handlebars helpers
require('../views/helpers');

templates.load = function(filename) {
  return Handlebars.compile(fs.readFileSync(filename).toString());
};

fs.readdirSync(__dirname + '/../views').forEach(function(file) {
  var filename = __dirname + '/../views/' + file,
      name     = file.replace('.hbs', '');

  templates[name] = templates.load(filename);
  fs.watch(filename, function reloadTemplate(event) {
    templates[name] = templates.load(filename);
  });
});


module.exports = templates;
