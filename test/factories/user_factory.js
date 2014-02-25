var Factory = require('factory-lady'),
    User    = require('../../models/user');

var nameCounter = 0,
    emailCounter = 0;

Factory.define('user', User, {
  username : function(cb) { cb('user' + ++nameCounter); },
  email    : function(cb) { cb('user' + ++emailCounter + '@boardgames.com'); },
  password : 'password'
});
