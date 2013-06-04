/*jslint node: true */
"use strict";

var moment = require('moment');

function defineGetters(obj) {
  Statistic.METRICS.forEach(function(metric) {
    obj.__defineGetter__(metric, function() {
      return this.getSum(metric);
    });
  });
}

function Statistic(user) {
  this.user = user;

  defineGetters(this);
}

Statistic.METRICS = ['gamesStarted', 'gamesJoined', 'gamesWon', 'gamesLost'];

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
  },
  getSum: function(key) {
    if (!this.user.stats[key]) { return 0; }
    var sum   = 0,
        stats = this.user.stats[key];
    Object.keys(stats).forEach(function(dayKey) {
      sum += stats[dayKey];
    });
    return sum;
  }
};

module.exports = Statistic;
