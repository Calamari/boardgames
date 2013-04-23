
var connect = require('connect'),
    quip    = require('quip'),
    http    = require('http'),

    app     = connect()
      .use(connect.static(__dirname + '/assets'))
      .use(connect.static(__dirname + '/public'))
      .use(connect.bodyParser())
      .use(connect.query())
      .use(quip())
      .use(require(__dirname + '/router')),

    server  = http.createServer(app);


server.listen(8124);
require(__dirname + '/chat_controller.js')(server);

console.log("server started on http://127.0.0.1:8124");
