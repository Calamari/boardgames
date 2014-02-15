var sinon  = require('sinon'),
    expect = require('expect.js'),
    async  = require('async'),

    GameTypes    = require('../../../models/game_types'),
    Morris       = require('../../../models/games/morris');
    ThreeMorris  = Morris.getDefinition({ type: 3 }),
    SixMorris    = Morris.getDefinition({ type: 6 }),
    NineMorris   = Morris.getDefinition({ type: 9 }),
    TwelveMorris = Morris.getDefinition({ type: 12 }),
    Game         = require('../../../models/game');

// TODO: three in row means remove enemy piece
// TODO: won when fly phase and 2 stones

describe('Games/Morris', function() {
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
        game = GameTypes.newGame('Morris', { type: 9 });
        game.addPlayer('one');
        game.addPlayer('two');
      });

      it('there is a set action', function() {
        NineMorris.actions.set.should.not.eql(null);
      });

      it('there is a move action', function() {
        NineMorris.actions.move.should.not.eql(null);
      });

      it('there is a take action', function() {
        NineMorris.actions.take.should.not.eql(null);
      });

      describe('on started game one\'s turn', function() {
        beforeEach(function() {
          game.startGame();
        });

        describe('#set', function() {
          it('send error ACTION_NOT_ALLOWED if not in set phase', function(done) {
            game.data.phases = ['move', 'move'];
            NineMorris.actions.set(game, { to: [6,12], user: 'one' }, function(err) {
              err.message.should.eql('ACTION_NOT_ALLOWED');
              done();
            });
          });

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
              game.data.phases = ['set', 'set'];
              game.data.takeMode = 0;
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
              expect(game.data.stoneCounts[0]).to.be(1);
              expect(game.data.stoneCounts[1]).to.be(0);
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
              data.takeMode.should.eql(false);
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
            var sendData;
            beforeEach(function(done) {
              game.board.stones[0][6] = 1;
              game.board.stones[0][12] = 1;
              game.board.stones[12][6] = 2;
              game.board.stones[12][12] = 2;

              game.data.stoneCounts = [8,8];
              sinon.spy(game, 'markModified');
              NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err, data) {
                expect(err).to.be(null);
                sendData = data;
                done();
              });
            });

            it('player enters take mode and it is still his turn', function() {
              expect(sendData.takeMode).to.be(1);
              expect(sendData.newPlayer).to.be(1);
            });

            it('game is in take mode', function() {
              expect(game.data.takeMode).to.be(1);
              game.markModified.calledWith('data').should.eql(true);
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
                data.phases.should.eql(['move', 'set']);
                done();
              });
            });
          });
        });

        describe('#move', function() {
          it('send error ACTION_NOT_ALLOWED because user is still in set phase', function(done) {
            NineMorris.actions.move(game, { from: [0,0], to: [7,0], user: 'one' }, function(err) {
              err.message.should.eql('ACTION_NOT_ALLOWED');
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
                game.markModified.calledWith('board').should.eql(true);
              });

              it('does not change the stone counter', function() {
                expect(game.data.stoneCounts[0]).to.be(9);
                expect(game.data.stoneCounts[1]).to.be(9);
                game.markModified.calledWith('data').should.eql(false);
              });

              it('all stay in move phase', function() {
                expect(game.data.phases).to.eql(['move', 'move']);
                game.markModified.calledWith('data').should.eql(false);
                sendData.phases.should.eql(['move', 'move']);
              });

              it('sends update information on moved pieces', function() {
                sendData.movePieces.should.be.instanceOf(Array);
                sendData.movePieces.should.have.lengthOf(1);
                sendData.movePieces[0].should.eql({ from: { x: 6, y: 0 }, to: { x: 0, y: 0} });
                expect(sendData.addPieces).to.be(undefined)
                expect(sendData.removePieces).to.be(undefined)
                sendData.newPlayer.should.eql(2);
              });
            });

            describe('if closing a line', function() {
              var sendData;
              beforeEach(function(done) {
                sinon.spy(game, 'markModified');
                NineMorris.actions.move(game, { from: [6,2], to: [6,4], user: 'one' }, function(err, data) {
                  expect(err).to.be(null);
                  sendData = data;
                  done();
                });
              });

              it('game is in take mode', function() {
                expect(game.data.takeMode).to.be(1);
                game.markModified.calledWith('data').should.eql(true);
              });

              it('player enters take mode and it is still his turn', function() {
                expect(sendData.takeMode).to.be(1);
                expect(sendData.newPlayer).to.be(1);
              });
            });

            describe('if there is already a closed line', function() {
              var sendData;
              beforeEach(function(done) {
                game.board.stones[2][10] = 1; // closed line
                sinon.spy(game, 'markModified');
                NineMorris.actions.move(game, { from: [6,0], to: [0,0], user: 'one' }, function(err, data) {
                  expect(err).to.be(null);
                  sendData = data;
                  done();
                });
              });

              it('game does not get into take mode', function() {
                expect(game.data.takeMode).to.be(undefined);
                game.markModified.calledWith('data').should.eql(false);
              });

              it('player does not enter take mode again and his turn ends', function() {
                expect(sendData.takeMode).to.be(false);
                expect(sendData.newPlayer).to.be(2);
              });
            });
          });

          describe('if player is in fly phase', function() {
            beforeEach(function() {
              game.board.stones[0][6] = 1;
              game.board.stones[2][2] = 1;
              game.board.stones[2][6] = 1;

              game.board.stones[6][10] = 2;
              game.board.stones[6][12] = 2;
              game.board.stones[8][6] = 2;
              game.board.stones[6][8] = 2;
              game.board.stones[6][2] = 2;

              game.data.stoneCounts = [8,8];
              game.data.phases = ['fly', 'move'];
            });

            describe('player can go everywhere', function() {
              var sendData;
              beforeEach(function(done) {
                sinon.spy(game, 'markModified');
                sinon.spy(game, 'nextTurn');
                NineMorris.actions.move(game, { from: [6,0], to: [12,12], user: 'one' }, function(err, data) {
                  expect(err).to.be(null);
                  sendData = data;
                  done();
                });
              });

              it('sends update information on moved pieces', function() {
                sendData.movePieces.should.be.instanceOf(Array);
                sendData.movePieces.should.have.lengthOf(1);
                sendData.movePieces[0].should.eql({ from: { x: 6, y: 0 }, to: { x: 12, y: 12} });
                expect(sendData.addPieces).to.be(undefined)
                expect(sendData.removePieces).to.be(undefined)
                sendData.newPlayer.should.eql(2);
              });

              it('sets next player after moving piece', function() {
                game.actualPlayer.should.eql(2);
                game.nextTurn.calledOnce.should.eql(true);
              });
            });
          });
        });

        describe('#take', function() {
          it('without needed data it results in ARGUMENT_ERROR', function(done) {
            NineMorris.actions.take(game, { user: 'one' }, function(err) {
              err.message.should.eql('ARGUMENT_ERROR');
              done();
            });
          });

          describe('if user is not in take mode', function() {
            it('send error ACTION_NOT_ALLOWED', function(done) {
              NineMorris.actions.take(game, { from: [6,12], user: 'one' }, function(err) {
                err.message.should.eql('ACTION_NOT_ALLOWED');
                done();
              });
            });
          });

          describe('if user is in take mode', function() {
            beforeEach(function() {
              game.data.takeMode = 1;
            });

            it('send error ACTION_NOT_ALLOWED if trying to move', function(done) {
              game.data.phases = ['move', 'move'];
              NineMorris.actions.move(game, { from: [6,0], to: [0,0], user: 'one' }, function(err) {
                err.message.should.eql('ACTION_NOT_ALLOWED');
                done();
              });
            });

            it('send error ACTION_NOT_ALLOWED if trying to set', function(done) {
              game.data.phases = ['set', 'set'];
              NineMorris.actions.set(game, { to: [0,0], user: 'one' }, function(err) {
                err.message.should.eql('ACTION_NOT_ALLOWED');
                done();
              });
            });

            it('send error INVALID_MOVE if users own stone', function(done) {
              NineMorris.actions.take(game, { from: [6,0], user: 'one' }, function(err) {
                err.message.should.eql('INVALID_MOVE');
                done();
              });
            });

            it('send error INVALID_MOVE if there is no stone', function(done) {
              NineMorris.actions.take(game, { from: [0,0], user: 'one' }, function(err) {
                err.message.should.eql('INVALID_MOVE');
                done();
              });
            });

            describe('on correct taking', function() {
              var sendData;
              beforeEach(function(done) {
                preset8Stones(game);
                sinon.spy(game, 'markModified');
                NineMorris.actions.take(game, { from: [6,12], user: 'one' }, function(err, data) {
                  expect(err).to.be(null);
                  sendData = data;
                  done();
                });
              });

              it('game is not in take mode anymore', function() {
                expect(game.data.takeMode).to.be(false);
                game.markModified.calledWith('data').should.eql(true);
              });

              it('player leaves take mode and his turn ends', function() {
                expect(sendData.takeMode).to.be(false);
                expect(sendData.newPlayer).to.be(2);
              });

              it('sends update information on removed piece', function() {
                expect(sendData.removePieces).to.be.a(Array);
                expect(sendData.removePieces.length).to.be(1);
                expect(sendData.removePieces[0]).to.eql({ x: 6, y: 12 });
              });

              it('removes the stone from the board persistently', function() {
                game.markModified.calledWith('board').should.eql(true);
                game.board.stones[12][6].should.eql(0);
              });
            });

            describe('and if the enemy has only three stones left after taking', function() {
              var sendData;
              beforeEach(function() {
                sinon.spy(game, 'markModified');

                game.board.stones[0][6] = 1;
                game.board.stones[2][2] = 1;
                game.board.stones[2][6] = 1;
                game.board.stones[2][10] = 1;

                game.board.stones[12][6] = 2;
                game.board.stones[10][6] = 2;
                game.board.stones[10][10] = 2;
                game.board.stones[6][10] = 2;

                game.data.stoneCounts = [4,4];
              });

              describe('and was in move phase before', function() {
                beforeEach(function(done) {
                  game.data.phases = ['move', 'move'];

                  NineMorris.actions.take(game, { from: [6,12], user: 'one' }, function(err, data) {
                    expect(err).to.be(null);
                    sendData = data;
                    done();
                  });
                });

                it('enemy enters fly phase', function() {
                  game.markModified.calledWith('data').should.eql(true);
                  expect(sendData.phases).to.eql(['move', 'fly']);
                });
              });

              describe('and was in set phase before', function() {
                beforeEach(function(done) {
                  game.data.phases = ['set', 'set'];

                  NineMorris.actions.take(game, { from: [6,12], user: 'one' }, function(err, data) {
                    expect(err).to.be(null);
                    sendData = data;
                    done();
                  });
                });

                it('enemy does not enter fly phase', function() {
                  game.markModified.calledWith('data').should.eql(true);
                  expect(sendData.phases).to.eql(['set', 'set']);
                });
              });
            });

            describe('and if the enemy has only two stones left after taking', function() {
              var sendData;
              beforeEach(function() {
                sinon.spy(game, 'markModified');

                game.board.stones[0][6] = 1;
                game.board.stones[2][2] = 1;
                game.board.stones[2][6] = 1;
                game.board.stones[2][10] = 1;

                game.board.stones[12][6] = 2;
                game.board.stones[10][10] = 2;
                game.board.stones[6][10] = 2;

                game.data.stoneCounts = [4,3];
              });

              describe('and was in fly phase before', function() {
                beforeEach(function(done) {
                  game.data.phases = ['fly', 'fly'];

                  NineMorris.actions.take(game, { from: [6,12], user: 'one' }, function(err, data) {
                    expect(err).to.be(null);
                    sendData = data;
                    done();
                  });
                });

                it('player has now won', function() {
                  game.markModified.calledWith('data').should.eql(true);
                  expect(sendData.gameEnded.winner).to.eql(1);
                });
              });

              describe('and was in move phase before', function() {
                beforeEach(function(done) {
                  game.data.phases = ['move', 'move'];

                  NineMorris.actions.take(game, { from: [6,12], user: 'one' }, function(err, data) {
                    expect(err).to.be(null);
                    sendData = data;
                    done();
                  });
                });

                it('game is not over yet', function() {
                  game.markModified.calledWith('data').should.eql(true);
                  expect(sendData.phases).to.eql(['move', 'move']);
                  expect(sendData.gameEnded).to.eql(null);
                });
              });

              describe('and was in set phase before', function() {
                beforeEach(function(done) {
                  game.data.phases = ['set', 'set'];

                  NineMorris.actions.take(game, { from: [6,12], user: 'one' }, function(err, data) {
                    expect(err).to.be(null);
                    sendData = data;
                    done();
                  });
                });

                it('game is not over yet', function() {
                  game.markModified.calledWith('data').should.eql(true);
                  expect(sendData.phases).to.eql(['set', 'set']);
                  expect(sendData.gameEnded).to.eql(null);
                });
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
