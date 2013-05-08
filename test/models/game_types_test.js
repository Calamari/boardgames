var mongoose = require('mongoose'),

    GameTypes = require('../../models/game_types');

describe('GameTypes', function() {

  it('#count returns 2 games', function(done) {
    GameTypes.count().should.eql(2);
    done();
  });

  it('#list returns "Multiplication" and "Reversi"', function(done) {
    GameTypes.list().should.have.lengthOf(2);
    GameTypes.list().should.eql(['Multiplication', 'Reversi']);
    done();
  });

  it('#containsType validates game type correclty', function(done) {
    GameTypes.containsType('Multiplication').should.eql(true);
    GameTypes.containsType('NoGame').should.eql(false);
    done();
  });
});
