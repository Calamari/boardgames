/*jslint node: true */
"use strict";

var Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj);
});

Handlebars.registerHelper('bool', function(obj) {
  return obj ? 'true' : 'false';
});
