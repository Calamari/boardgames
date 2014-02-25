var request = require('supertest'),
    express = require('express'),
    router  = require(__dirname + '/../../router.js'),
    app     = require(__dirname + '/../../app')(router),

    cheerio = require('cheerio'),
    expect  = require('expect.js'),
    sinon   = require('sinon'),
    Factory = require('factory-lady'),

    User    = require('../../models/user'),
    Game    = require('../../models/game');

require('../factories/user_factory');
require('../factories/game_factory');

describe.only('GameController', function() {
  var loggedInUser;

  before(function(done) {
    User.remove(done);
  });
  before(function(done) {
    Factory.create('user', { username: 'mrlogin' }, function(user) {
      loggedInUser = user;
      done();
    });
  });
  beforeEach(function(done) {
    Game.remove(done);
  });

  describe('when logged in', function() {
    beforeEach(function() {
      express.request.user = loggedInUser;
    });

    describe('POST /game/:type', function() {
      it('does create the game', function(done) {
        request(app)
        .post('/game/Reversi')
        .expect('Content-Type', /text\/plain/)
        .end(function(err, res) {
          expect(res.status).to.equal(302);
          expect(res.header.location).to.match(/^\/game\/[a-f0-9]+$/);
          Game.findOne(function(err, game) {
            expect(game.type).to.equal('Reversi');
            expect(game.players).to.have.length(1);
            expect(game.players[0]).to.equal(loggedInUser.username);
            done();
          });
        });
      });

      it('of wrong game type does not create a game and says error', function(done) {
        request(app)
        .post('/game/Revers')
        .expect('Content-Type', /text\/plain/)
        .end(function(err, res) {
          expect(res.status).to.equal(302);
          expect(res.header.location).to.equal('/');
          var cookie = res.headers['set-cookie'];
          request(app)
          .get(res.header.location)
          .set('cookie', cookie)
          .end(function(err, res) {
            var $ = cheerio.load(res.text);
            expect($('.error-message').html()).to.equal('Game of type &quot;Revers&quot; could not be created.');
            Game.findOne(function(err, game) {
              expect(game).to.equal(null);
              done();
            });
          });
        });
      });
    });

    describe('if someone created a game already (but not started yet)', function() {
      var game;
      beforeEach(function(done) {
        Factory.create('game', { players: ['bob'] }, function(g) {
          game = g;
          done();
        });
      });

      describe('PUT /game/:id/join', function() {
        it('lets us join the game', function(done) {
          request(app)
          .put('/game/' + game.id + '/join')
          .expect('Content-Type', /text\/plain/)
          .end(function(err, res) {
            expect(res.status).to.equal(302);
            expect(res.header.location).to.equal('/game/' + game.id);
            var cookie = res.headers['set-cookie'];
            request(app)
            .get(res.header.location)
            .set('cookie', cookie)
            .end(function(err, res) {
              Game.findOne(function(err, game) {
                expect(game.players).to.have.length(2);
                expect(game.players[0]).to.equal('bob');
                expect(game.players[1]).to.equal(loggedInUser.username);
                expect(game.started).to.equal(true);
                done();
              });
            });
          });
        });
      });

      describe('GET /game/:id', function() {
        it('opens the game', function(done) {
          request(app)
          .get('/game/' + game.id)
          .expect('Content-Type', /text\/html/)
          .end(function(err, res) {
            expect(res.status).to.equal(200);
            var $ = cheerio.load(res.text);
            expect($('.nav-bar').html()).to.contain('in a game of ' + game.type + ':');
            expect($('#gamefield')).to.have.length(1);
            done();
          });
        });
      });
    });

    describe('if there is a game already started', function() {
      var game;
      beforeEach(function(done) {
        Factory.create('game', { players: ['bob', 'joe'] }, function(g) {
          game = g;
          game.startGame();
          game.save(done);
        });
      });

      describe('PUT /game/:id/join', function() {
        it('lets us join the game', function(done) {
          request(app)
          .put('/game/' + game.id + '/join')
          .expect('Content-Type', /text\/plain/)
          .end(function(err, res) {
            expect(res.status).to.equal(302);
            expect(res.header.location).to.equal('/game/' + game.id);
            var cookie = res.headers['set-cookie'];
            request(app)
            .get(res.header.location)
            .set('cookie', cookie)
            .end(function(err, res) {
              var $ = cheerio.load(res.text);
              expect($('.error-message').html()).to.equal('You can not join this game.');
              Game.findOne(function(err, game) {
                expect(game.players).to.have.length(2);
                expect(game.players[0]).to.equal('bob');
                expect(game.players[1]).to.equal('joe');
                expect(game.started).to.equal(true);
                done();
              });
            });
          });
        });
      });
    });

    describe('having already created a game (but not started yet)', function() {
      var game;
      beforeEach(function(done) {
        Factory.create('game', { players: [loggedInUser.username] }, function(g) {
          game = g;
          done();
        });
      });

      describe('PUT /game/:id/cancel', function() {
        it('cancels the game', function(done) {
          request(app)
          .put('/game/' + game.id + '/cancel')
          .expect('Content-Type', /text\/plain/)
          .end(function(err, res) {
            expect(res.status).to.equal(302);
            expect(res.header.location).to.equal('/');
            var cookie = res.headers['set-cookie'];
            request(app)
            .get(res.header.location)
            .set('cookie', cookie)
            .end(function(err, res) {
              var $ = cheerio.load(res.text);
              expect($('.success-message').html()).to.equal('Game has been cancelled');
              Game.findOne(function(err, game) {
                expect(game).to.equal(null);
                done();
              });
            });
          });
        });
      });

      describe('PUT /game/:id/cancel', function() {
        it('returns 404 on not existing game', function(done) {
          request(app)
          .put('/game/' + game.id + '1/cancel')
          .expect('Content-Type', /text\/html/)
          .expect(404, done);
        });
      });
    });

    describe('having a started game', function() {
      var game;
      beforeEach(function(done) {
        Factory.create('game', { players: [loggedInUser.username, 'bob'] }, function(g) {
          game = g;
          game.startGame();
          game.save(done);
        });
      });

      describe('PUT /game/:id/give_up', function() {
        it('gives up the game', function(done) {
          request(app)
          .put('/game/' + game.id + '/give_up')
          .expect('Content-Type', /text\/plain/)
          .end(function(err, res) {
            expect(res.status).to.equal(302);
            expect(res.header.location).to.equal('/game/' + game.id);
            var cookie = res.headers['set-cookie'];
            request(app)
            .get(res.header.location)
            .set('cookie', cookie)
            .end(function(err, res) {
              var $ = cheerio.load(res.text);
              expect($('.success-message').html()).to.equal('You gave up the game.');
              Game.findOne(function(err, game) {
                expect(game.ended).to.equal(true);
                done();
              });
            });
          });
        });
      });

      describe('PUT /game/:id/giveUp', function() {
        it('returns 404 on not existing game', function(done) {
          request(app)
          .put('/game/' + game.id + '1/give_up')
          .expect('Content-Type', /text\/html/)
          .expect(404, done);
        });
      });
    });

    describe('DELETE /game/:id', function() {
      describe('on own game that is not started', function() {
        var game;
        beforeEach(function(done) {
          Factory.create('game', { players: [loggedInUser.username] }, function(g) {
            game = g;
            done();
          });
        });

        it('deletes the game', function(done) {
          request(app)
          .del('/game/' + game.id)
          .expect('Content-Type', /text\/plain/)
          .end(function(err, res) {
            expect(res.status).to.equal(302);
            expect(res.header.location).to.equal('/');
            var cookie = res.headers['set-cookie'];
            request(app)
            .get(res.header.location)
            .set('cookie', cookie)
            .end(function(err, res) {
              var $ = cheerio.load(res.text);
              expect($('.success-message').html()).to.equal('Game successfully removed.');
              Game.findOne({ _id: game.id }, function(err, game) {
                expect(game).to.equal(null);
                done();
              });
            });
          });
        });
      });

      describe('on own game that is already started', function() {
        var game, anotherUser;
        beforeEach(function(done) {
          Factory.create('user', function(user) {
            anotherUser = user;
            done();
          });
        });
        beforeEach(function(done) {
          Factory.create('game', { players: [anotherUser.username, loggedInUser.username] }, function(g) {
            game = g;
            game.startGame();
            game.save(done);
          });
        });

        it('does not delete the game', function(done) {
          request(app)
          .del('/game/' + game.id)
          .expect('Content-Type', /text\/plain/)
          .end(function(err, res) {
            expect(res.status).to.equal(302);
            expect(res.header.location).to.equal('/');
            var cookie = res.headers['set-cookie'];
            request(app)
            .get(res.header.location)
            .set('cookie', cookie)
            .end(function(err, res) {
              var $ = cheerio.load(res.text);
              expect($('.error-message').html()).to.equal('You can not remove this game.');
              Game.findOne({ _id: game.id }, function(err, game) {
                expect(game).to.not.equal(null);
                done();
              });
            });
          });
        });
      });
    });
  });
});
