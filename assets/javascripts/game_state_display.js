(function(win, $) {
  "use strict";

  var GameStateDisplay = function(container, game, options) {
    var $container = $(container),
        username = options.username,
        actualPlayer,

        check = function() {
          var state = game.getGameState();
          console.log(state, game);
          if (state === 'ended') {
            $container.html(game.getWinner() + "'s turn");
          } else if (state === 'waiting') {
            $container.html("waiting for players");
          } else {
            actualPlayer = game.getActualPlayer();
            if (actualPlayer === username) {
              $container.html("Your turn");
            } else {
              $container.html(actualPlayer + "'s turn");
            }
          }
        };
    game.onChange = check;
    check();
  };

  win.GameStateDisplay = GameStateDisplay;
}(window, jQuery));
