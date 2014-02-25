var Factory = require('factory-lady'),
    Game    = require('../../models/game');

Factory.define('game', Game, {
  type    : 'Reversi',
  players : function(cb) {
    Factory.create('user', function(user) {
      cb([ user.username ]);
    });
  }
});
