/*jslint node: true */
"use strict";

/**
 * Registers all templates into returned module as hash
 * Partials will also be registered
 * Files in subfolders will be concatenated with _ instead of /
 * Files will recompiled on File changes
 */

// This could be exportet in an node module?

var Handlebars = require('handlebars'),
    fs         = require('fs'),
    walk       = require('walk'),

    templates  = [],

    viewsDir   = __dirname + '/../views';

// load handlebars helpers
require('../views/helpers');

templates.load = function(filename) {
  return Handlebars.compile(fs.readFileSync(filename).toString());
};

var walker = walk.walkSync(viewsDir);
walker.on("file", function (dir, fileStats, next) {
  var filename     = fileStats.name,
      name         = filename.replace('.hbs', ''),
      isPartial    = name[0] === '_',
      dirFromViews = dir.replace(viewsDir, '').replace('/', '_');

  if (dirFromViews[0] === '_') {
    dirFromViews = dirFromViews.substr(1);
  }

  function reloadTemplate() {
    try {
      var compiledTemplate = templates.load(dir + '/' + filename);
      if (isPartial) {
        name = name.substr(1);
        if (dirFromViews) {
          name = dirFromViews + '_' + name;
        }
        Handlebars.registerPartial(name, compiledTemplate);
      } else {
        if (dirFromViews) {
          name = dirFromViews + '_' + name;
        }
        templates[name] = compiledTemplate;
      }
    } catch(e) {
      setTimeout(function() {
        reloadTemplate(event);
      }, 500);
    }
  }

  reloadTemplate();
  fs.watch(filename, reloadTemplate);
  next();
});

module.exports = templates;
