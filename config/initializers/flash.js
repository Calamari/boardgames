/*jslint node: true */
"use strict";

module.exports = function(app) {
  app.use(require('connect-flash')())
     .use(function(req, res, next) {
       res.locals.flash = {
         info    : req.flash('info'),
         error   : req.flash('error'),
         success : req.flash('success')
       };
       next();
     });
};
