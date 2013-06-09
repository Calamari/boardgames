/*jslint node: true */
"use strict";

var Handlebars = require('handlebars');

// ==== HELPERS for games index: ====

Handlebars.registerHelper('playersList', function(game, users) {
  var actualPlayer = game.actualPlayerName(),
      newList      = game.players.map(function(player) {
        var cls = player === actualPlayer ? 'you' : '',
            score = game.scoreOf(player),
            scoreString = score !== undefined ? '(' + score + ')' : '';
        cls += game.winnerName === player ? ' winner' : '';
        return '<li class="' + cls + '"><img src="' + users[player].avatarUrl + '&s=40" width="40" height="40">' + player + ' ' + scoreString + '</li>';
      });
  return newList.join('');
});

Handlebars.registerHelper('winningClass', function(game, username) {
  if (game.ended) {
    return game.winnerName === username ? 'won' : 'lost';
  }
  return '';
});
