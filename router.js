/*jslint node: true */
'use strict';

module.exports = function(app) {
  app.use(function(req, res, next) {
    if (req.originalUrl === '/favicon.ico') {
      res.render('');
    } else {
      next();
    }
  });
  require('./controllers/startpage_controller')(app);
  require('./controllers/game_controller')(app);
  require('./controllers/session_controller')(app);
  require('./controllers/user_controller')(app);
  require('./controllers/error_controller')(app);
};
