/*jslint node: true */
"use strict";

var Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj);
});

Handlebars.registerHelper('bool', function(obj) {
  return obj ? 'true' : 'false';
});

Handlebars.registerHelper('lowercase', function(str) {
  return (str || '').toLowerCase();
});

Handlebars.registerHelper('uppercase', function(str) {
  return (str || '').toUpperCase();
});

Handlebars.registerHelper('ifSingular', function(value, data) {
  if (value === 1) {
    return data.fn();
  } else {
    return data.inverse();
  }
});
