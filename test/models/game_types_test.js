var mongoose = require('mongoose'),

    GameTypes = require('../../models/game_types');

describe('GameTypes', function() {

  it('#count returns 3 games', function(done) {
    GameTypes.count().should.eql(3);
    done();
  });

  it('#list returns "Multiplication" and "Reversi"', function(done) {
    GameTypes.list().should.have.lengthOf(3);
    GameTypes.list().should.eql(['Multiplication', 'Reversi', 'Morris']);
    done();
  });

  it('#containsType validates game type correclty', function(done) {
    GameTypes.containsType('Multiplication').should.eql(true);
    GameTypes.containsType('NoGame').should.eql(false);
    done();
  });
});
