/*jslint node: true */
"use strict";

var Handlebars = require('handlebars');

Handlebars.registerHelper('css', function(filename) {
  return css(filename);
});

Handlebars.registerHelper('js', function(filename) {
  return js(filename);
});

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj);
});

Handlebars.registerHelper('bool', function(obj) {
  return obj ? 'true' : 'false';
});



// ==== HELPERS for games index: ====

Handlebars.registerHelper('playersList', function(game, users) {
  var actualPlayer = game.actualPlayerName(),
      newList      = game.players.map(function(player) {
        var cls = player === actualPlayer ? 'you' : '';
        cls += game.winnerName === player ? ' winner' : '';
        return '<li class="' + cls + '"><img src="' + users[player].avatarUrl + '&s=40" width="40" height="40">' + player + '</li>';
      });
  return newList.join('');
});

Handlebars.registerHelper('winningClass', function(game, username) {
  if (game.ended) {
    return game.winnerName === username ? 'won' : 'lost';
  }
  return '';
});
