/*jslint node: true */
"use strict";

module.exports = function(app) {
  require('./controllers/startpage_controller')(app);
  require('./controllers/game_controller')(app);
  require('./controllers/session_controller')(app);
  require('./controllers/user_controller')(app);
  require('./controllers/error_controller')(app);
};
