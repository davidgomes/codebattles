Accounts.onCreateUser(function(options, user) {
  user.score = 0;
  user.ranking = 1200;
  user.lastSub = 0;
  user.roomId = 0;

  if (options.username.length > 10) {
    throw new Meteor.Error(404, "Username should have a maximum of 10 characters.");
  }

  if (options.profile)
    user.profile = options.profile;
  return user;
});
