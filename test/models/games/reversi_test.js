var sinon    = require('sinon'),

    Reversi = require('../../../models/games/reversi').getDefinition();
    Game    = require('../../../models/game');

describe('Games/Reversi', function() {
  it('needs 2 players', function() {
    Reversi.minPlayers.should.eql(2);
    Reversi.maxPlayers.should.eql(2);
  });

  it('boardsetup gives every player two stones in the middle', function() {
    var board = Reversi.newBoard();
    board.stones[3][3].should.eql(1);
    board.stones[4][4].should.eql(1);
    board.stones[3][4].should.eql(2);
    board.stones[4][3].should.eql(2);
  });

  describe('actions', function() {
    var game;

    beforeEach(function() {
      game = new Game({ type: 'Reversi'});
      game.addPlayer('one');
      game.addPlayer('two');
    });

    it('there is a set action', function() {
      Reversi.actions.set.should.not.eql(null);
    });

    describe('#set', function() {
      describe('on started game one\'s turn', function() {
        beforeEach(function() {
          game.startGame();
        });

        it('without needed data it results in ARGUMENT_ERROR', function(done) {
          Reversi.actions.set(game, { user: 'one' }, function(err) {
            err.message.should.eql('ARGUMENT_ERROR');
            done();
          });
        });

        it('send error INVALID_MOVE if no enemy stone is encapsuled', function(done) {
          Reversi.actions.set(game, { to: [2,2], user: 'one' }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('send error INVALID_MOVE if beside enemy stone but no trapped stones', function(done) {
          Reversi.actions.set(game, { to: [2,5], user: 'one' }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('send error INVALID_MOVE if stone is not connected with any other stone', function(done) {
          Reversi.actions.set(game, { to: [1,6], user: 'one' }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('send error INVALID_MOVE if field is already taken', function(done) {
          game.board.stones[5][3] = 1;
          Reversi.actions.set(game, { to: [3,5], user: 'one' }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('places the stone on the board', function(done) {
          Reversi.actions.set(game, { to: [3,5], user: 'one' }, function(err) {
            game.board.stones[5][3].should.eql(1);
            done();
          });
        });

        it('setting a stone turns encapsuled enemy stones', function(done) {
          Reversi.actions.set(game, { to: [3,5], user: 'one' }, function(err) {
            game.board.stones[4][3].should.eql(1);
            done();
          });
        });

        it('setting a stone does not turn not encapsuled enemy stones', function(done) {
          Reversi.actions.set(game, { to: [3,5], user: 'one' }, function(err) {
            game.board.stones[3][4].should.eql(2);
            done();
          });
        });

        it('sets next player after moving piece', function(done) {
          sinon.spy(game, 'nextTurn');
          Reversi.actions.set(game, { to: [3,5], user: 'one' }, function(err) {
            game.actualPlayer.should.eql(2);
            game.nextTurn.calledOnce.should.eql(true);
            done();
          });
        });

        it('also excepts {x:x,y:y} point objects as from and to', function(done) {
          sinon.spy(game, 'nextTurn');
          Reversi.actions.set(game, { to: { x: 3, y: 5 }, user: 'one' }, function(err) {
            game.actualPlayer.should.eql(2);
            game.nextTurn.calledOnce.should.eql(true);
            done();
          });
        });

        it('sends update information on captured and added pieces', function(done) {
          Reversi.actions.set(game, { to: { x: 3, y: 5 }, user: 'one' }, function(err, data) {
            data.addPieces.should.be.instanceOf(Array);
            data.addPieces.should.have.lengthOf(1);
            data.addPieces[0].should.eql({ x: 3, y: 5, player: 1 });
            data.capturedPieces.should.be.instanceOf(Array);
            data.capturedPieces.should.have.lengthOf(1);
            data.capturedPieces.should.includeEql({ x: 3, y: 4, player: 1 });
            data.newPlayer.should.eql(2);
            done();
          });
        });

        it('it does not send gameEnded event with update', function(done) {
          Reversi.actions.set(game, { to: [3,5], user: 'one' }, function(err, data) {
            (data.gameEnded === null).should.eql(true);
            done();
          });
        });

        describe('if this was the last empty spot on the board', function() {
          beforeEach(function() {
            for (var y=0; y<8; ++y) {
              for (var x=0; x<8; ++x) {
                game.board.stones[y][x] = x < 4 ? 2 : 1;
              }
            }
            game.board.stones[0][1] = 0;
          });

          it('it sends update with gameEnded event', function(done) {
            Reversi.actions.set(game, { to: [1,0], user: 'one' }, function(err, data) {
              data.gameEnded.should.eql({ winner: 1 });
              done();
            });
          });
        });

        describe('if after the turn the enemy has no valid move left', function() {
          beforeEach(function() {
            game.board.stones = [ [ 2, 2, null, 2, 2, 2, 2, 2 ], [ 2, 2, 1, 2, 1, 1, 1, 1 ], [ 1, 2, 2, 1, 1, 1, 1, 1 ], [ 1, 2, 2, 1, 1, 1, 1, 1 ], [ null, 1, 2, 2, 1, 1, 1, 1 ], [ null, 1, 1, 2, 2, 1, 1, 1 ], [ null, null, 1, 2, 2, 2, 1, 1 ], [ 2, 2, 2, 1, 1, 1, 1, 1 ] ];
            game.actualPlayer = 2;
            game.save();
          });

          it('it sends update with gameEnded event', function(done) {
            Reversi.actions.set(game, { to: [2,0], user: 'two' }, function(err, data) {
              data.gameEnded.should.eql({ winner: 1 });
              done();
            });
          });
        });

        it('with valid action mard board as modified so it can be saved', function(done) {
          sinon.spy(game, 'markModified');
          Reversi.actions.set(game, { to: [3,5], user: 'one' }, function(err, data) {
            game.markModified.calledWith('board').should.eql(true);
            done();
          });
        });

      });
    });

  });
});
