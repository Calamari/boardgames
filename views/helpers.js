/*jslint node: true */
"use strict";

var Handlebars = require('handlebars');

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj);
});

Handlebars.registerHelper('bool', function(obj) {
  return obj ? 'true' : 'false';
});

Handlebars.registerHelper('playersList', function(game) {
  var actualPlayer = game.actualPlayerName(),
      newList      = game.players.map(function(player) {
    return player === actualPlayer ? '<strong>' + player + '</strong>' : player;
  });
  return newList.join(', ');
});
