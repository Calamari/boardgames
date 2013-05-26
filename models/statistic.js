/*jslint node: true */
"use strict";

var moment = require('moment');

function Statistic(user) {
  this.user = user;
}

Statistic.prototype = {
  get: function(key, date) {
    var dayKey = moment(date).utc().format("YYYY-MM-DD");
    if (!this.user.stats[key]) {
      this.user.stats[key] = {};
    }
    return this.user.stats[key][dayKey] || 0;
  },
  set: function(key, value, date) {
    var dayKey = moment(date).utc().format("YYYY-MM-DD");
    if (!this.user.stats[key]) {
      this.user.stats[key] = {};
    }
    this.user.stats[key][dayKey] = value;
    this.user.markModified('stats');
    return this;
  },
  increment: function(key) {
    this.set(key, this.get(key) + 1);
    return this;
  },
  decrement: function(key) {
    this.set(key, this.get(key) - 1);
    return this;
  },
  getHistory: function(key) {
    return this.user.stats[key] || {};
  }
};
module.exports = Statistic;