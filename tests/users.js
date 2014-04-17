var assert = require('assert');

suite('users', function() {
  test('create user', function(done, server, client) {
    client.eval(function() {
      var anyError;

      Accounts.createUser({
        username: 'dude',
        password: 'testpass'
      }, function(error) {
        anyError = !! error;
        emit('done', anyError);
      });
    }).once('done', function(anyError) {
      assert.equal(anyError, false);
      done();
    });
  });
});
