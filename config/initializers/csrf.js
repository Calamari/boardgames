/*jslint node: true */
"use strict";

var express = require('express');

module.exports = function(app) {
  app.use(express.csrf())
     .use(function(req, res, next) {
       res.locals.csrfToken = req.session._csrf;
       next();
     });
};
