var sinon    = require('sinon'),

    Multiplication = require('../../../models/games/multiplication');
    Game           = require('../../../models/game');

describe('Games/Multiplication', function() {
  it('needs 2 players', function() {
    Multiplication.minPlayers.should.eql(2);
    Multiplication.maxPlayers.should.eql(2);
  });

  it('boardsetup has every player two corners', function() {
    var board = Multiplication.newBoard();
    board.stones[0][0].should.eql(1);
    board.stones[7][0].should.eql(1);
    board.stones[0][7].should.eql(2);
    board.stones[7][7].should.eql(2);
  });

  describe('actions', function() {
    var game;

    beforeEach(function() {
      game = new Game({ type: 'Multiplication'});
      game.addPlayer('one');
      game.addPlayer('two');
    });

    it('there is a move action', function() {
      Multiplication.actions.move.should.not.eql(null);
    });

    describe('#move', function() {
      it('returns error on not started game', function(done) {
        Multiplication.actions.move(game, {}, function(err) {
          err.message.should.eql('GAME_NOT_STARTED');
          done();
        });
      });

      describe('on started game one\'s turn', function() {
        beforeEach(function() {
          game.startGame();
        });

        it('does not return a GAME_NOT_STARTED error', function(done) {
          Multiplication.actions.move(game, {}, function(err) {
            err.message.should.not.eql('GAME_NOT_STARTED');
            done();
          });
        });

        it('without needed data it results in ARGUMENT_ERROR', function(done) {
          Multiplication.actions.move(game, {}, function(err) {
            err.message.should.eql('ARGUMENT_ERROR');
            done();
          });
        });

        it('send error NOT_YOUR_TURN if user is not at turn', function(done) {
          Multiplication.actions.move(game, { from: [0,0], to: [1,0], user: 'two' }, function(err) {
            err.message.should.eql('NOT_YOUR_TURN');
            done();
          });
        });

        it('send error NOT_YOUR_PIECE if moving not your piece', function(done) {
          Multiplication.actions.move(game, { from: [7,7], to: [7,6], user: 'one' }, function(err) {
            err.message.should.eql('NOT_YOUR_PIECE');
            done();
          });
        });

        it('send error INVALID_MOVE if move is not allowed', function(done) {
          Multiplication.actions.move(game, { from: [0,0], to: [3,0], user: 'one' }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('moving stone one field distance clones it', function(done) {
          Multiplication.actions.move(game, { from: [0,0], to: [1,0], user: 'one' }, function(err) {
            game.board.stones[0][0].should.eql(1);
            game.board.stones[0][1].should.eql(1);
            done();
          });
        });

        it('moving stone two field distance moves it', function(done) {
          Multiplication.actions.move(game, { from: [0,0], to: [2,0], user: 'one' }, function(err) {
            game.board.stones[0][0].should.eql(0);
            game.board.stones[0][2].should.eql(1);
            done();
          });
        });

        it('sets next player after moving piece', function(done) {
          sinon.spy(game, 'nextTurn');
          Multiplication.actions.move(game, { from: [0,0], to: [1,0], user: 'one' }, function(err) {
            game.actualPlayer.should.eql(2);
            game.nextTurn.calledOnce.should.eql(true);
            done();
          });
        });

        it('also excepts {x:x,y:y} point objects as from and to', function(done) {
          sinon.spy(game, 'nextTurn');
          Multiplication.actions.move(game, { from: { x: 0, y: 0 }, to: { x: 1, y: 0 }, user: 'one' }, function(err) {
            game.actualPlayer.should.eql(2);
            game.nextTurn.calledOnce.should.eql(true);
            done();
          });
        });

        describe('if there are some enemy pieces standing around', function() {
          beforeEach(function() {
            game.board.stones[1][0] = 2;
            game.board.stones[1][1] = 2;
            game.board.stones[1][2] = 2;
            game.board.stones[1][3] = 2;
          });

          it('captures units if cloning besides them', function(done) {
            Multiplication.actions.move(game, { from: [0,0], to: [1,0], user: 'one' }, function(err) {
              game.board.stones[1][0].should.eql(1);
              game.board.stones[1][1].should.eql(1);
              game.board.stones[1][2].should.eql(1);
              game.board.stones[1][3].should.eql(2);
              done();
            });
          });

          it('captures units if jumping besides them', function(done) {
            Multiplication.actions.move(game, { from: [0,0], to: [2,0], user: 'one' }, function(err) {
              game.board.stones[1][0].should.eql(2);
              game.board.stones[1][1].should.eql(1);
              game.board.stones[1][2].should.eql(1);
              game.board.stones[1][3].should.eql(1);
              done();
            });
          });

          it('send error INVALID_MOVE if destination is already occupied', function(done) {
            Multiplication.actions.move(game, { from: [0,0], to: [0,1], user: 'one' }, function(err) {
              err.message.should.eql('INVALID_MOVE');
              done();
            });
          });

          it('sends update information in the callbacks on jump', function(done) {
            Multiplication.actions.move(game, { from: [0,0], to: [2,0], user: 'one' }, function(err, data) {
              data.removePieces.should.be.instanceOf(Array);
              data.removePieces.should.have.lengthOf(1);
              data.removePieces[0].should.eql({ x: 0, y: 0 });
              data.addPieces.should.be.instanceOf(Array);
              data.addPieces.should.have.lengthOf(1);
              data.addPieces[0].should.eql({ x: 2, y: 0, player: 1 });
              data.newPlayer.should.eql(2);
              done();
            });
          });

          it('sends update information on captured pieces', function(done) {
            Multiplication.actions.move(game, { from: [0,0], to: [1,0], user: 'one' }, function(err, data) {
              data.capturedPieces.should.be.instanceOf(Array);
              data.capturedPieces.should.have.lengthOf(3);
              data.capturedPieces.should.includeEql({ x: 0, y: 1, player: 1 });
              data.capturedPieces.should.includeEql({ x: 1, y: 1, player: 1 });
              data.capturedPieces.should.includeEql({ x: 2, y: 1, player: 1 });
              data.newPlayer.should.eql(2);
              done();
            });
          });

        });

        it('sends update information in the callbacks on move', function(done) {
          Multiplication.actions.move(game, { from: [0,0], to: [1,0], user: 'one' }, function(err, data) {
            data.removePieces.should.have.lengthOf(0);
            data.addPieces.should.have.lengthOf(1);
            data.addPieces[0].should.eql({ x: 1, y: 0, player: 1 });
            data.newPlayer.should.eql(2);
            done();
          });
        });

        describe('if this was the last move possible', function() {
          beforeEach(function() {
            for (var y=0; y<8; ++y) {
              for (var x=0; x<8; ++x) {
                game.board.stones[y][x] = x > 4 ? 2 : 1;
              }
            }
            game.board.stones[0][1] = 0;
          });

          it('it sends update with gameEnded event', function(done) {
            Multiplication.actions.move(game, { from: [0,0], to: [1,0], user: 'one' }, function(err, data) {
              data.gameEnded.should.eql({ winner: 1 });
              done();
            });
          });
        });
      });
    });

  });
});
