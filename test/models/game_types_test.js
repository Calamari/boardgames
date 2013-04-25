var mongoose = require('mongoose'),

    GameTypes = require('../../models/game_types');

describe('GameTypes', function() {

  it('#count returns 1 game', function(done) {
    GameTypes.count().should.eql(1);
    done();
  });

  it('#list returns only "Multiplication"', function(done) {
    GameTypes.list().should.have.lengthOf(1);
    GameTypes.list().should.eql(['Multiplication']);
    done();
  });

  it('#containsType validates game type correclty', function(done) {
    GameTypes.containsType('Multiplication').should.eql(true);
    GameTypes.containsType('NoGame').should.eql(false);
    done();
  });
});
