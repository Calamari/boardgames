/*jslint node: true */
"use strict";

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var router = require(__dirname + '/router'),
    argv   = require('optimist').argv,
    config = require('./config'),
    port   = argv.port || config.app.port,
    address= argv.address || config.app.address,
    app    = require(__dirname + '/app')(router);

app.server.listen(port, address);
// Should Chat also be done via Socketeer?
require('./chat_controller.js')(app.server, app.io);
require('./controllers/game_socket_controller.js')(app.socketeer, app);

console.log("server started on http://" + address + ":" + port);
