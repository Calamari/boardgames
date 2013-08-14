/*jslint node: true */
'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var router = require(__dirname + '/router'),
    app    = require(__dirname + '/app')(router, 'mongodb://localhost/boardgames_', {
      dbPostfix: process.env.NODE_ENV === 'development' ? 'dev' : process.env.NODE_ENV
    }),
    repl   = require('repl');


console.log('Starting in ' + process.env.NODE_ENV + ' mode.');

var instance = repl.start({
  prompt: 'boardgames> ',
  input: process.stdin,
  output: process.stdout
});

instance.context.router = router;
instance.context.app = app;

instance.on('exit', function () {
  console.log('Exiting console, goodbye!');
  process.exit();
});
