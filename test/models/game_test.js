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
      game.started.should.eql(false);
    });


    describe('when having enough players', function() {
      beforeEach(function() {
        game.addPlayer('alf');
        game.addPlayer('ralf');
      });

      it('calls GameTypes.newBoard to get the initial board', function() {
        game.startGame();
        testGameDef.newBoard.calledOnce.should.eql(true);
        testGameDef.newBoard.calledWith(game).should.eql(true);
        game.board.should.eql({ foo: 42 });
      });

      it('sets started property of game to true', function() {
        game.started.should.eql(false);
        game.startGame();
        game.started.should.eql(true);
      });

      it('sets actualPlayer to the first one', function() {
        game.startGame();
        game.actualPlayer.should.eql(1);
      });
    });
  });

  describe('#endGame', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('one');
      game.addPlayer('two');
      game.startGame();
    });

    it('sets game to ended', function() {
      game.endGame('one');
      game.ended.should.eql(true);
    });

    it('sets timestamp endedAt', function() {
      game.endGame('one');
      game.endedAt.should.not.eql(null);
    });

    it('sets winner to this player', function() {
      game.endGame('two');
      game.winner.should.eql(2);
    });

    it('works also with player position', function() {
      game.endGame(1);
      game.ended.should.eql(true);
      game.winner.should.eql(1);
    });
  });

  describe('#getPlayerPosition', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('jon');
      game.addPlayer('john');
    });

    it('returns number of player starting at 1', function() {
      game.getPlayerPosition('jon').should.equal(1);
      game.getPlayerPosition('john').should.equal(2);
    });

    it('returns false if not found', function() {
      game.getPlayerPosition('babe').should.equal(false);
    });
  });

  describe('#isPlayersTurn', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('jon');
      game.addPlayer('john');
      game.startGame();
    });

    it('works with user names', function() {
      game.isPlayersTurn('jon').should.equal(true);
      game.isPlayersTurn('johnny').should.equal(false);
      game.isPlayersTurn('john').should.equal(false);
    });

    it('works with user player position', function() {
      game.isPlayersTurn(1).should.equal(true);
      game.isPlayersTurn(0).should.equal(false);
      game.isPlayersTurn(2).should.equal(false);
    });
  });

  describe('#isReady', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('jon');
    });

    it('returns false if not enough players', function() {
      game.isReady().should.equal(false);
    });

    it('returns true if enough players', function() {
      game.addPlayer('john');
      game.isReady().should.equal(true);
    });

    it('returns true if already started', function() {
      game.addPlayer('john');
      game.startGame();
      game.isReady().should.equal(true);
    });
  });

  describe('#canJoin', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('jon');
    });

    it('works if place is free and not started', function() {
      game.canJoin('john').should.equal(true);
    });

    it('returns false if player is already participant', function() {
      game.canJoin('jon').should.equal(false);
    });

    it('returns false if game already started', function() {
      game.started = true; // never do this directly in real life!!
      game.canJoin('john').should.equal(false);
    });

    it('returns false if maxPlayers would exceed', function() {
      game.addPlayer('john');
      game.canJoin('johnny').should.equal(false);
    });
  });

  describe('#giveUp', function() {
    var game, clock;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('one');
      game.addPlayer('two');
      game.startGame();
    });

    it('sets game to ended', function() {
      game.giveUp('one');
      game.ended.should.eql(true);
    });

    it('sets timestamp endedAt', function() {
      game.giveUp('one');
      game.endedAt.should.not.eql(null);
    });

    it('sets winner to the other player', function() {
      // TODO: write a test for three players, there is no winner then?
      game.giveUp('one');
      game.winner.should.eql(2);
    });

    it('works also with player position', function() {
      game.giveUp(2);
      game.ended.should.eql(true);
      game.winner.should.eql(1);
    });

    it('works also with player position and the other player', function() {
      game.giveUp(1);
      game.winner.should.eql(2);
    });
  });

  describe('#isPlayer', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('jon');
    });

    it('is true if player is player in that game', function() {
      game.isPlayer('jon').should.equal(true);
    });

    it('is false if player is not player in that game', function() {
      game.isPlayer('john').should.equal(false);
    });
  });

  describe('#nextTurn', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('jon');
      game.addPlayer('john');
      game.startGame();
    });

    it('works as expected', function() {
      game.actualPlayer.should.eql(1);
      game.nextTurn();
      game.turns.should.eql(1);
      game.actualPlayer.should.eql(2);
      game.nextTurn();
      game.turns.should.eql(2);
      game.actualPlayer.should.eql(1);
    });
  });

  describe('#actualPlayerName', function() {
    var game;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('jon');
      game.addPlayer('john');
      game.startGame();
    });

    it('works as expected', function() {
      game.actualPlayerName().should.eql('jon');
      game.nextTurn();
      game.actualPlayerName().should.eql('john');
    });
  });

  describe('#action', function() {
    var game, Multiplication;
    beforeEach(function() {
      game = new Game({ type: 'Multiplication' });
      game.addPlayer('one');
      game.addPlayer('two');
      game.startGame();
      Multiplication = GameTypes.get('Multiplication');
      sinon.spy(Multiplication.actions, 'move');
      sinon.spy(game, 'save');
      sinon.spy(game, 'markModified');
    });

    afterEach(function() {
      Multiplication.actions.move.restore();
      game.save.restore();
      game.markModified.restore();
    });

    it('calls the action method of associated game definition', function(done) {
      var callMe,
          cb = function() {
            game.save.called.should.eql(true);
            game.markModified.calledWith('board').should.eql(true);
            done();
          };
      game.action('move', { from: [0,0], to: [0,1], user: 'one' }, cb);
      Multiplication.actions.move.calledWith(game, { from: [0,0], to: [0,1], user: 'one' }).should.eql(true);
    });

    it('has game saved after doing the action', function(done) {
      game.action('move', { from: [0,0], to: [0,1], user: 'one' }, function() {
        Game.findById(game.id, function(err, loadedGame) {
          loadedGame.board.stones[1][0].should.eql(1);
          done();
        });
      });
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
