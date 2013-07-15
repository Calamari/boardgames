/*jslint node: true */
"use strict";

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var router = require(__dirname + '/router'),
    argv   = require('optimist').argv,
    port   = argv.port || 8124,
    app    = require(__dirname + '/app')(router, 'mongodb://localhost/boardgames_', {
      dbPostfix: process.env.NODE_ENV == 'development' ? 'dev' : process.env.NODE_ENV
    });

app.server.listen(port);
// Should Chat also be done via Socketeer?
require('./chat_controller.js')(app.server, app.io);
require('./controllers/game_socket_controller.js')(app.socketeer, app);

console.log("server started on http://127.0.0.1:" + port);
