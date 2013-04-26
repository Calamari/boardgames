var router   = require(__dirname + '/../router.js'),
    app      = require(__dirname + '/../app')(router, 'mongodb://localhost/boardgames_test');

describe('GET /', function() {
  it('returns 200', function(done) {
    app.request().get('/')
      .expect(200, done);
  });
});
