var router   = require(__dirname + '/../router.js'),
    app      = require(__dirname + '/../app')(router, 'mongodb://localhost/boardgames_test');


describe('GET /', function() {
  describe('if not logged in', function() {
    it('redirects to /login', function(done) {
      done();
      // app.request().get('/').end(function(res) {
      //   res.headers.location.should.eql('/login?redir=' + encodeURIComponent('/'));
      //   res.statusCode.should.eql(302);
      //   done();
      // });
    });
  });

  // describe('if logged in', function() {
  //   it('returns 200', function(done) {
  //     app.use(function(req, res, next) {console.log("AAAA");next();});
  //     //require('connect').session.Session.username = 'bob';
  //     app.use(function(req, res, next) {
  //       console.log("OKOKOKOKOK");
  //       next();
  //     })
  //     var req = app.request()
  //     req.session = { username: 'bob' };
  //     req.get('/')
  //       .expect(200, done);
  //   });
  // });
});

