var sinon     = require('sinon'),
    expect    = require('expect.js'),

    GameTypes = require('../../../models/game_types'),
    Tafl      = require('../../../models/games/tafl'),
    Tablut    = Tafl.getDefinition({ type: 'Tablut' });

describe('Games/Tafl (Tablut)', function() {
  it('needs 2 players', function() {
    Tablut.minPlayers.should.eql(2);
    Tablut.maxPlayers.should.eql(2);
  });

  it('boardsetup has one player in the middle and the other on the edges', function() {
    var board = Tablut.newBoard();
    // The king in the middle
    board.stones[4][4].should.eql('1k');
    // The Swedes beside him
    board.stones[4][2].should.eql('1s');
    board.stones[4][3].should.eql('1s');
    board.stones[4][5].should.eql('1s');
    board.stones[4][6].should.eql('1s');
    board.stones[2][4].should.eql('1s');
    board.stones[3][4].should.eql('1s');
    board.stones[5][4].should.eql('1s');
    board.stones[6][4].should.eql('1s');
    // The Muscovites attacking from the edge
    board.stones[0][2].should.eql('');
    board.stones[0][3].should.eql('2s');
    board.stones[0][4].should.eql('2s');
    board.stones[0][5].should.eql('2s');
    board.stones[0][6].should.eql('');
    board.stones[1][4].should.eql('2s');

    board.stones[8][2].should.eql('');
    board.stones[8][3].should.eql('2s');
    board.stones[8][4].should.eql('2s');
    board.stones[8][5].should.eql('2s');
    board.stones[8][6].should.eql('');
    board.stones[7][4].should.eql('2s');

    board.stones[2][0].should.eql('');
    board.stones[3][0].should.eql('2s');
    board.stones[4][0].should.eql('2s');
    board.stones[5][0].should.eql('2s');
    board.stones[6][0].should.eql('');
    board.stones[4][1].should.eql('2s');

    board.stones[2][8].should.eql('');
    board.stones[3][8].should.eql('2s');
    board.stones[4][8].should.eql('2s');
    board.stones[5][8].should.eql('2s');
    board.stones[6][8].should.eql('');
    board.stones[4][7].should.eql('2s');
  });

  describe('actions', function() {
    var game;

    beforeEach(function() {
      game = GameTypes.newGame('Tafl', { type: 'Tablut'});
      game.addPlayer('one');
      game.addPlayer('two');
    });

    it('there is a move action', function() {
      Tablut.actions.move.should.not.eql(null);
    });

    describe('#move', function() {
      describe('on started game one\'s turn', function() {
        beforeEach(function() {
          game.startGame();
        });

        it('without needed data it results in ARGUMENT_ERROR', function(done) {
          Tablut.actions.move(game, { user: 'one' }, function(err) {
            err.message.should.eql('ARGUMENT_ERROR');
            done();
          });
        });

        it('send error NOT_YOUR_PIECE if moving not your piece', function(done) {
          Tablut.actions.move(game, { from: [7,7], to: [7,6] }, function(err) {
            err.message.should.eql('NOT_YOUR_PIECE');
            done();
          });
        });

        it('send error INVALID_MOVE if move is not allowed', function(done) {
          Tablut.actions.move(game, { from: [4,3], to: [8,0] }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('writes into log', function(done) {
          var previousLength = game.log.length;
          Tablut.actions.move(game, { from: [4,3], to: [5,3] }, function(err) {
            expect(game.log.length).to.equal(previousLength+1);
            var line = game.log[previousLength];
            expect(line.name).to.equal('move');
            expect(line.from.x).to.equal(4);
            expect(line.from.y).to.equal(3);
            expect(line.to.x).to.equal(5);
            expect(line.to.y).to.equal(3);
            expect(line.player).to.equal(1);
            done();
          });
        });


        it('moving a piece one field works', function(done) {
          Tablut.actions.move(game, { from: [4,3], to: [5,3] }, function(err) {
            game.board.stones[3][4].should.eql('');
            game.board.stones[3][5].should.eql('1s');
            done();
          });
        });

        it('moving a piece over more fields works', function(done) {
          Tablut.actions.move(game, { from: [4,3], to: [6,3] }, function(err) {
            game.board.stones[3][4].should.eql('');
            game.board.stones[3][6].should.eql('1s');
            done();
          });
        });

        it('send error INVALID_MOVE if moving diagonal', function(done) {
          Tablut.actions.move(game, { from: [4,3], to: [3,2] }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('a simple stone cannot move to corner fields (player 1)', function(done) {
          game.board.stones[0][2] = '1s';
          Tablut.actions.move(game, { from: [2,0], to: [0,0] }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('a simple stone cannot move to corner fields (player 2)', function(done) {
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: [3,0], to: [0,0] }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        describe('later in the game, when king has moved from center field', function() {
          beforeEach(function() {
            game.board.stones[4][4] = '';
            game.board.stones[4][3] = '1k';
            game.board.stones[4][5] = '';
            game.board.stones[4][6] = '';
          });

          it('the king cant go back to center field again', function(done) {
            Tablut.actions.move(game, { from: [3,4], to: [4,4] }, function(err) {
              err.message.should.eql('INVALID_MOVE');
              done();
            });
          });

          it('the swedes can not enter the center field', function(done) {
            Tablut.actions.move(game, { from: [4,3], to: [4,4] }, function(err) {
              err.message.should.eql('INVALID_MOVE');
              done();
            });
          });

          it('the moscovits can not enter the center field either', function(done) {
            game.actualPlayer = 2;
            Tablut.actions.move(game, { from: [7,4], to: [4,4] }, function(err) {
              err.message.should.eql('INVALID_MOVE');
              done();
            });
          });
        });

        it('sets next player after moving piece', function(done) {
          sinon.spy(game, 'nextTurn');
          Tablut.actions.move(game, { from: [4,3], to: [6,3] }, function(err) {
            game.actualPlayer.should.eql(2);
            game.nextTurn.calledOnce.should.eql(true);
            done(err);
          });
        });

        it('also excepts {x:x,y:y} point objects as from and to', function(done) {
          sinon.spy(game, 'nextTurn');
          Tablut.actions.move(game, { from: { x: 4, y: 3 }, to: { x: 6, y: 3 } }, function(err) {
            game.actualPlayer.should.eql(2);
            game.nextTurn.calledOnce.should.eql(true);
            done(err);
          });
        });

        it('units cannot go through other units (x axis)', function(done) {
          game.board.stones[4][3] = '';
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: { x: 0, y: 4 }, to: { x: 3, y: 4 } }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('units cannot go through other units (y axis)', function(done) {
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: { x: 3, y: 8 }, to: { x: 3, y: 3 } }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('units cannot go where other units stand', function(done) {
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: { x: 3, y: 8 }, to: { x: 3, y: 4 } }, function(err) {
            err.message.should.eql('INVALID_MOVE');
            done();
          });
        });

        it('if a Swede is surrounded on opposing sides, it is caputured', function(done) {
          game.board.stones[4][3] = '';
          game.board.stones[0][3] = '2s';
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: { x: 3, y: 0 }, to: { x: 3, y: 4 } }, function(err) {
            game.board.stones[4][3].should.eql('2s');
            game.board.stones[4][2].should.eql(''); // this one was surrounded
            game.board.stones[0][3].should.eql('');
            done(err);
          });
        });

        it('if a Muscovite is surrounded on opposing sides, it is caputured', function(done) {
          game.board.stones[3][3] = '2s';
          Tablut.actions.move(game, { from: { x: 2, y: 4 }, to: { x: 2, y: 3 } }, function(err) {
            game.board.stones[3][2].should.eql('1s');
            game.board.stones[3][3].should.eql(''); // this one was surrounded
            game.board.stones[4][2].should.eql('');
            done(err);
          });
        });

        it('if the king is surrounded only on opposing sides, it is not caputured', function(done) {
          game.board.stones[4][3] = '';
          game.board.stones[4][2] = '1k';
          game.board.stones[4][4] = '';
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: { x: 3, y: 8 }, to: { x: 3, y: 4 } }, function(err) {
            game.board.stones[4][3].should.eql('2s');
            game.board.stones[4][2].should.eql('1k'); // this one was surrounded
            game.board.stones[8][3].should.eql('');
            done(err);
          });
        });

        it('if a Muscovite is not surrounded on opposing sides, it is not caputured', function(done) {
          game.board.stones[6][0] = '';
          game.board.stones[6][1] = '2s';
          Tablut.actions.move(game, { from: { x: 2, y: 4 }, to: { x: 2, y: 6 } }, function(err) {
            game.board.stones[6][1].should.eql('2s');
            done(err);
          });
        });

        it('sends update information on captured pieces', function(done) {
          game.board.stones[4][3] = '';
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: { x: 3, y: 0 }, to: { x: 3, y: 4 } }, function(err, data) {
            data.removePieces.should.be.instanceOf(Array);
            data.removePieces.should.have.lengthOf(1);
            data.removePieces.should.includeEql({ x: 2, y: 4 });
            data.newPlayer.should.eql(1);
            done();
          });
        });

        it('if the king is surrounded on all four sides by Muscovites, the Muscovites win', function(done) {
          game.board.stones[3][2] = '2s';
          game.board.stones[4][3] = '2s';
          game.board.stones[4][2] = '1k';
          game.board.stones[4][4] = '2s';
          game.board.stones[8][2] = '2s';
          game.actualPlayer = 2;
          Tablut.actions.move(game, { from: { x: 2, y: 8 }, to: { x: 2, y: 5 } }, function(err, data) {
            data.gameEnded.should.eql({ winner: 2 });
            done(err);
          });
        });

        it('if the king moves to a corner piece, the Swedes win', function(done) {
          game.board.stones[0][1] = '1k';
          Tablut.actions.move(game, { from: { x: 1, y: 0 }, to: { x: 0, y: 0 } }, function(err, data) {
            data.gameEnded.should.eql({ winner: 1 });
            done(err);
          });
        });
      });
    });

  });
});
