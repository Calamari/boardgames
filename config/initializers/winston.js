/*jslint node: true */
'use strict';

var winston = require('winston');

module.exports = function(app) {
  var transports = [
    new winston.transports.File({
      filename: __dirname + '/../../log/' + process.env.NODE_ENV + '.log'
    })
  ];

  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({ prettyPrint: true }));
  }
  app.logger = new winston.Logger({
    transports: transports,
    level: process.env.NODE_ENV === 'production' ? 'warning' : 'info'
  });

  app.logger.info("TEST");
};
