/*jslint node: true */
"use strict";

var async      = require('async'),

    undef;

// allows to create a function with some before filters
function Action(filters, cb) {
  if (cb === undef) {
    cb = filters;
    filters = [];
  }

  return function(req, res, next) {
    var args = arguments;
    async.applyEachSeries(filters, req, res, function() {
      cb.apply(this, args);
    });
  };
}

module.exports = {
  Action: Action
};
