/*jslint node: true */
"use strict";

var express = require('express');

module.exports = function(app) {
  var csrf = express.csrf();
  app.use(function(req, res, next) {
       if (process.env.NODE_ENV === 'test') { return next(); }
       csrf(req, res, next);
     })
     .use(function(req, res, next) {
       res.locals.csrfToken = req.session._csrf;
       next();
     });
};
