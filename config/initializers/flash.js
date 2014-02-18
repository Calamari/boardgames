/*jslint node: true */
'use strict';

var _ = require('lodash');

var hbs = require('express-hbs');

module.exports = function(app) {
  app
    .use(require('connect-flash')())
    .use(function(req, res, next) {
      hbs.registerHelper('flash', function(options) {
        var result = '';
        ['info', 'success', 'error'].forEach(function(type) {
          req.flash(type).forEach(function(msg) {
            result += options.fn({ type: type, msg: msg });
          });
        });
        return result;
      });
      next();
    });
};
