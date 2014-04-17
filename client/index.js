Template.index.loggedIn = function() {
  return !! Meteor.user();
};

rooms = Meteor.subscribe('rooms');

Deps.autorun(function() {
  Meteor.subscribe('usersLSub');
  Meteor.subscribe('ownUser');
});
