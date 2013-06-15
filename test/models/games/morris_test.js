var sinon  = require('sinon'),
    expect = require('expect.js'),
    async  = require('async'),

    Morris       = require('../../../models/games/morris');
    ThreeMorris  = Morris.getDefinition({ type: 3 }),
    SixMorris    = Morris.getDefinition({ type: 6 }),
    NineMorris   = Morris.getDefinition({ type: 9 }),
    TwelveMorris = Morris.getDefinition({ type: 12 }),
    Game         = require('../../../models/game');

// TODO: three in row means remove enemy piece
// TODO: won when fly phase and 2 stones

describe.only('Games/Morris', function() {
  describe('Nine Mens Morris', function() {
    it('needs 2 players', function() {
      NineMorris.minPlayers.should.eql(2);
      NineMorris.maxPlayers.should.eql(2);
    });

    it('board has 13 rows', function() {
      var board = NineMorris.newBoard();
      expect(board.stones.length).to.be(13);
    });

    it('on boardsetup no player has any stones', function() {
      var board = NineMorris.newBoard(),
          x,y;

      for (y=board.stones.length; y--;) {
        for (x=board.stones[y].length; x--;) {
          expect(board.stones[y][x]).to.be(null);
        }
      }
    });

    describe('actions', function() {
      var game;

      beforeEach(function() {
        game = new Morris.newGame({ type: 9 });
        game.addPlayer('one');
        game.addPlayer('two');
      });

      it('there is a set action', function() {
        NineMorris.actions.set.should.not.eql(null);
      });

      it('there is a move action', function() {
        NineMorris.actions.move.should.not.eql(null);
      });

      describe('on started game one\'s turn', function() {
        beforeEach(function() {
          game.startGame();
        });

        describe('#set', function() {
          it('both player are in set phase', function() {
            expect(game.data.phases).to.eql(['set', 'set']);
          });

          it('without needed data it results in ARGUMENT_ERROR', function(done) {
            NineMorris.actions.set(game, { user: 'one' }, function(err) {
              err.message.should.eql('ARGUMENT_ERROR');
              done();
            });
          });

          it('send error INVALID_MOVE if field is not a cross on the board', function(done) {
            var allowedPoints = {
                  "0": { "0":true, "6":true, "12":true },
                  "2": { "2":true, "6":true, "10":true },
                  "4": { "4":true, "6":true, "8":true },
                  "6": { "0":true, "2":true, "4":true, "8":true, "10":true, "12":true },
                  "8": { "4":true, "6":true, "8":true },
                  "10":{ "2":true, "6":true, "10":true },
                  "12":{ "0":true, "6":true, "12":true }
                },
                allFields = [],
                x, y;

            for (y=12; y--;) {
              for (x=12; x--;) {
                allFields.push({ x: x, y: y});
              }
            }

            async.eachSeries(allFields, function(field, next) {
              NineMorris.actions.set(game, { to: field, user: 'one' }, function(err) {
                if (!allowedPoints[field.y] || !allowedPoints[field.y][field.x]) {
                  err.message.should.eql('INVALID_MOVE');
                }
                next();
              });
            }, done);
          });

          it('send error INVALID_MOVE if field is already taken', function(done) {
            game.board.stones[0][0] = 2;
            NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err) {
              err.message.should.eql('INVALID_MOVE');
              done();
            });
          });

          it('places the stone on the board', function(done) {
            NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err) {
              game.board.stones[0][0].should.eql(1);
              done();
            });
          });

          it('increments the stone counter', function(done) {
            sinon.spy(game, 'markModified');
            NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err) {
              expect(game.data.stoneCount[0]).to.be(1);
              expect(game.data.stoneCount[1]).to.be(0);
              game.markModified.calledWith('data').should.eql(true);
              done();
            });
          });

          it('sets next player after setting piece', function(done) {
            sinon.spy(game, 'nextTurn');
            NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err) {
              game.actualPlayer.should.eql(2);
              game.nextTurn.calledOnce.should.eql(true);
              done();
            });
          });

          it('also excepts {x:x,y:y} point objects as from and to', function(done) {
            sinon.spy(game, 'nextTurn');
            NineMorris.actions.set(game, { to: { x: 0, y: 0 }, user: 'one' }, function(err) {
              game.actualPlayer.should.eql(2);
              game.nextTurn.calledOnce.should.eql(true);
              done();
            });
          });

          it('sends update information on added pieces', function(done) {
            NineMorris.actions.set(game, { to: { x: 0, y: 0 }, user: 'one' }, function(err, data) {
              data.addPieces.should.be.instanceOf(Array);
              data.addPieces.should.have.lengthOf(1);
              data.addPieces[0].should.eql({ x: 0, y: 0, player: 1 });
              data.removeMode.should.eql(false);
              data.newPlayer.should.eql(2);
              done();
            });
          });

          it('it does not send gameEnded event with update', function(done) {
            NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err, data) {
              expect(data.gameEnded).to.be(null);
              done();
            });
          });

          it('with valid action mard board as modified so it can be saved', function(done) {
            sinon.spy(game, 'markModified');
            NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err, data) {
              game.markModified.calledWith('board').should.eql(true);
              done();
            });
          });

          describe('if having a line', function() {
            beforeEach(function() {
              game.board.stones[0][6] = 1;
              game.board.stones[0][12] = 1;
              game.board.stones[12][6] = 2;
              game.board.stones[12][12] = 2;

              game.data.stoneCounts = [8,8];
            });

            it('player enters remove mode and it is still his turn', function(done) {
              NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err, data) {
                expect(data.removeMode).to.be(true);
                expect(data.newPlayer).to.be(1);
                done();
              });
            });
          });

          describe('if one player has set 9 stones', function() {
            beforeEach(function() {
              preset8Stones(game);
            });

            it('he reaches move phase', function(done) {
              sinon.spy(game, 'markModified');
              NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err, data) {
                expect(game.data.phases).to.eql(['move', 'set']);
                game.markModified.calledWith('data').should.eql(true);
                data.phase.should.eql('move');
                done();
              });
            });
          });
        });

        describe('#move', function() {
          it('send error INVALID_MOVE because user is still in set phase', function(done) {
            NineMorris.actions.move(game, { from: [0,0], to: [7,0], user: 'one' }, function(err) {
              err.message.should.eql('INVALID_MOVE');
              done();
            });
          });

          describe('if player is in move phase', function() {
            beforeEach(function() {
              preset8Stones(game);
              game.board.stones[0][12] = 1;
              game.board.stones[12][0] = 2;
              game.data.stoneCounts = [9,9];
              game.data.phases = ['move', 'move'];
            });

            it('without needed data it results in ARGUMENT_ERROR', function(done) {
              NineMorris.actions.move(game, { user: 'one' }, function(err) {
                err.message.should.eql('ARGUMENT_ERROR');
                done();
              });
            });

            it('send error INVALID_MOVE because it\'s not users point', function(done) {
              NineMorris.actions.move(game, { from: [0,0], to: [6,0], user: 'one' }, function(err) {
                err.message.should.eql('INVALID_MOVE');
                done();
              });
            });

            it('send error INVALID_MOVE if to position is not empty', function(done) {
              NineMorris.actions.move(game, { from: [6,0], to: [6,2], user: 'one' }, function(err) {
                err.message.should.eql('INVALID_MOVE');
                done();
              });
            });

            it('send error INVALID_MOVE if points are not connected', function(done) {
              NineMorris.actions.move(game, { from: [6,0], to: [6,2], user: 'one' }, function(err) {
                err.message.should.eql('INVALID_MOVE');
                done();
              });
            });

            it('send error INVALID_MOVE on any moved between unconnected points', function(done) {
              //NineMorris.actions.move(game, { from: [6,0], to: [6,2], user: 'one' }, function(err) {
                //err.message.should.eql('INVALID_MOVE');
                done();
              //});
            });

            describe('after moving piece', function() {
              var sendData;
              beforeEach(function(done) {
                sinon.spy(game, 'markModified');
                sinon.spy(game, 'nextTurn');
                NineMorris.actions.move(game, { from: [6,0], to: [0,0], user: 'one' }, function(err, data) {
                  expect(err).to.be(null);
                  sendData = data;
                  done();
                });
              });

              it('sets next player after moving piece', function() {
                game.actualPlayer.should.eql(2);
                game.nextTurn.calledOnce.should.eql(true);
              });

              it('moves the stone on the board', function() {
                game.board.stones[0][0].should.eql(1);
                game.board.stones[0][6].should.eql(0);
              });

              it('does not change the stone counter', function() {
                expect(game.data.stoneCounts[0]).to.be(9);
                expect(game.data.stoneCounts[1]).to.be(9);
                game.markModified.calledWith('data').should.eql(false);
              });

              it('all stay in move phase', function() {
                expect(game.data.phases).to.eql(['move', 'move']);
                game.markModified.calledWith('data').should.eql(false);
                sendData.phase.should.eql('move');
              });

              it('sends update information on moved pieces', function() {
                sendData.addPieces.should.be.instanceOf(Array);
                sendData.addPieces.should.have.lengthOf(1);
                sendData.addPieces[0].should.eql({ x: 0, y: 0, player: 1 });
                sendData.removePieces.should.be.instanceOf(Array);
                sendData.removePieces.should.have.lengthOf(1);
                sendData.removePieces[0].should.eql({ x: 6, y: 0});
                sendData.newPlayer.should.eql(2);
              });
            });

            describe('if closing a line', function() {
              var sendData;
              beforeEach(function(done) {
                NineMorris.actions.move(game, { from: [6,2], to: [6,4], user: 'one' }, function(err, data) {
                  expect(err).to.be(null);
                  sendData = data;
                  done();
                });
              });

              it('player enters remove mode and it is still his turn', function() {
                expect(sendData.removeMode).to.be(true);
                expect(sendData.newPlayer).to.be(1);
              });
            });
          });
        });

      });
    });
  });

  function preset8Stones(game) {
    game.board.stones[0][6] = 1;
    game.board.stones[2][2] = 1;
    game.board.stones[2][6] = 1;
    game.board.stones[4][4] = 1;
    game.board.stones[4][8] = 1;
    game.board.stones[6][0] = 1;
    game.board.stones[6][4] = 1;
    game.board.stones[8][8] = 1;

    game.board.stones[12][6] = 2;
    game.board.stones[10][6] = 2;
    game.board.stones[10][10] = 2;
    game.board.stones[6][10] = 2;
    game.board.stones[6][12] = 2;
    game.board.stones[8][6] = 2;
    game.board.stones[6][8] = 2;
    game.board.stones[6][2] = 2;

    game.data.stoneCounts = [8,8];
  }
});
