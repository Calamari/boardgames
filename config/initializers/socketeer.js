/*jslint node: true */
"use strict";

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.locals.socketeerId = req.socketeer.id;
    next();
  });
};
