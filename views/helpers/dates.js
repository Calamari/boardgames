/*jslint node: true */
"use strict";

var Handlebars = require('handlebars'),
    strftime   = require('strftime');

Handlebars.registerHelper('datetime', function(date, format) {
  return strftime(format, date);
});
