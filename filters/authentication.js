/*jslint node: true */
"use strict";

function redirectIfLogin(req, res, next) {
  if (req.session.username) {
    next();
  } else {
    res.redirect('/login');
  }
}

module.exports = {
  redirectIfLogin: redirectIfLogin
};
