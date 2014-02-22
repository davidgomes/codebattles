LoggedUsers = new Meteor.Collection('LoggedUsers');

Meteor.methods({
  logInsert: function(username) {
    LoggedUsers.insert({username: username, timestamp: new Date().getTime()});
  },

  logUpdate: function(username) {
    LoggedUsers.update(
      {username: username},
      {$set: {timestamp: new Date().getTime()}}
    );
  }
});
