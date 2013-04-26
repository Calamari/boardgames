/*jslint node: true */
"use strict";

var router = require(__dirname + '/router'),
    app    = require(__dirname + '/app')(router, 'mongodb://localhost/boardgames_dev');

app.server.listen(8124);
require(__dirname + '/chat_controller.js')(app.server, app.io);
require(__dirname + '/game_controller.js')(app.server, app.io);

console.log("server started on http://127.0.0.1:8124");
