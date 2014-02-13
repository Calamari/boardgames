
var _  = require('lodash'),
    fs = require('fs'),

    ENV = process.env.NODE_ENV || 'development',

    config = {};

function deepExtend(obj, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      if (_.isArray(source[key])) {
        obj[key] = source[key];
      } else if (_.isObject(source[key])) {
        obj[key] = obj[key] || {};
        deepExtend(obj[key], source[key]);
      } else {
        obj[key] = source[key];
      }
    }
  }
}

deepExtend(config, require(__dirname + '/config/application.json'));
deepExtend(config, require(__dirname + '/config/' + ENV + '.json'));
if (ENV !== 'test' && fs.existsSync(__dirname + '/config/local.json')) {
  deepExtend(config, require(__dirname + '/config/local.json'));
}
module.exports = config;
