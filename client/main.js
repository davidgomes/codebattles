Template.main.loggedIn = function() {
  return !! Meteor.user();
};

rooms = Meteor.subscribe('rooms');

/*Meteor.autosubscribe(function () {
  Meteor.subscribe('messages', Session.get('currentRoomId'));
});*/

Deps.autorun(function() {
  Meteor.subscribe('usersLSub');
/* if (!Session.get("currentRoomId")) {
    if (!(typeof heartBeat === 'undefined')) {
      Meteor.clearInterval(heartBeat);
    }
  }*/
});
