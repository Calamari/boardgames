/*jslint node: true */
"use strict";

var Handlebars = require('handlebars');

Handlebars.registerHelper('css', function(filename) {
  return css(filename);
});

Handlebars.registerHelper('js', function(filename) {
  return js(filename);
});
