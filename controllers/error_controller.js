/*jslint node: true */
"use strict";

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.send(404, 'Not Found!');
  });
};
