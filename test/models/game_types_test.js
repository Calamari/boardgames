var mongoose = require('mongoose'),

    expect   = require('expect.js'),

    GameTypes = require('../../models/game_types');

describe('GameTypes', function() {

  it('#count returns 4 games', function(done) {
    GameTypes.count().should.eql(4);
    done();
  });

  it('#list returns all games', function(done) {
    GameTypes.list().should.have.lengthOf(4);
    GameTypes.list().should.eql(['Multiplication', 'Reversi', 'Morris', 'Tafl']);
    done();
  });

  it('#containsType validates game type correclty', function(done) {
    GameTypes.containsType('Multiplication').should.eql(true);
    GameTypes.containsType('NoGame').should.eql(false);
    done();
  });

  it('#newHotseatGame creates hotseat game', function(done) {
    var givenConfig = { foo: 'config' };
    var game = GameTypes.newHotseatGame('Multiplication', givenConfig);
    expect(game.type).to.eql('Multiplication');
    expect(game.config).to.eql(givenConfig);
    expect(game.hotseat).to.be.true;
    done();
  });
});
