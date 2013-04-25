var sinon    = require('sinon'),

    Multiplication = require('../../../models/games/multiplication');

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

  // describe('new instance', function() {
  //   var game;
  //   beforeEach(function(done) {
  //     game = new Game({ type: 'Multiplication' });
  //     done();
  //   });

  //   it('has set a createdAt', function(done) {
  //     game.createdAt.should.not.eql(null);
  //     done();
  //   });

  //   it('has set an empty board', function(done) {
  //     game.board.should.eql({});
  //     done();
  //   });
  // });
});
