/*jslint node: true */
"use strict";

var auth      = require('../filters/authentication'),
    mongoose  = require('mongoose');


module.exports = function(app) {
  var User = mongoose.model('User');

  app.get('/profile', auth.redirectIfLogin, function(req, res, next) {
    res.redirect('/profile/' + req.user.username);
  });
  app.get('/profile/:profileName', auth.redirectIfLogin, function(req, res, next) {
    User.findOne({ username: req.params.profileName }, function(err, user) {
      if (err || !user) { return next(); }
      res.render('profile', {
        user: user
      });
    });
  });
};
