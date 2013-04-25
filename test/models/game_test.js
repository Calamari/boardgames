var mongoose = require('mongoose'),
    sinon    = require('sinon'),

    Game      = require('../../models/game'),
    GameTypes = require('../../models/game_types');

describe('Game', function() {

  // afterEach(function(done) {
  //   console.log(Game);
  //   Game.remove(function() {
  //     console.log("removed");
  //     done();
  //   });
  // });

  describe('validations', function() {
    it('needs a game type', function(done) {
      new Game({}).save(function(err) {
        err.errors.type.should.not.eql(null);
        done();
      });
    });

    it('game type has to be defined in GamesList', function(done) {
      new Game({ type: 'NotMultiplication'}).save(function(err) {
        err.errors.type.should.not.eql(null);
        done();
      });
    });
  });

  describe('new instance', function() {
    var game;
    beforeEach(function(done) {
      game = new Game({ type: 'Multiplication' });
      done();
    });

    it('has set a createdAt', function(done) {
      game.createdAt.should.not.eql(null);
      done();
    });

    it('has set an empty board', function(done) {
      game.board.should.eql({});
      done();
    });
  });

  describe('#startGame', function() {
    var game,
        testGameDef = {
          minPlayers: 2,
          maxPlayers: 2,
          newBoard: function() {
            return { foo: 42 };
          }
        },
        orig;
    beforeEach(function() {
      orig = GameTypes.get;
      sinon.spy(testGameDef, 'newBoard');
      GameTypes.get = function() { return testGameDef; };
      game = new Game({ type: 'TestGame' });
    });

    afterEach(function() {
      GameTypes.get = orig;
      testGameDef.newBoard.restore();
    });

    it('returns error if not enough players', function() {
      var err = game.startGame();
      err.message.should.eql('NOT_ENOUGH_PLAYERS');
    });

    it('calls GameTypes.newBoard to get the initial board', function() {
      game.addPlayer('alf');
      game.addPlayer('ralf');
      game.startGame();
      testGameDef.newBoard.calledOnce.should.eql(true);
      testGameDef.newBoard.calledWith(game).should.eql(true);
      game.board.should.eql({ foo: 42 });
    });
  });

  describe('#addPlayer', function() {
    var game;
    beforeEach(function(done) {
      game = new Game({ type: 'Multiplication' });
      done();
    });

    it('can be called with one name', function() {
      game.addPlayer('bob');
      game.players.should.have.lengthOf(1);
      game.players.should.include('bob');
    });

    it('can be called with two different names', function() {
      game.addPlayer('bob');
      game.addPlayer('berta');
      game.players.should.have.lengthOf(2);
      game.players.should.include(['bob']);
      game.players.should.include(['berta']);
    });

    it('does not add twice the same name', function() {
      game.addPlayer('bob');
      game.addPlayer('bob');
      game.players.should.have.lengthOf(1);
      game.players.should.include('bob');
    });

    it('does not add more players as defined by GameType', function() {
      game.addPlayer('bob');
      game.addPlayer('berta');
      game.addPlayer('tim');
      game.players.should.have.lengthOf(2);
      game.players.should.include('bob');
      game.players.should.include('berta');
    });

    it('has return values', function() {
      game.addPlayer('bob').should.equal(true);
      game.addPlayer('bob').should.equal(false);
      game.addPlayer('berta').should.equal(true);
      game.addPlayer('tim').should.equal(false);
    });
  });
});
