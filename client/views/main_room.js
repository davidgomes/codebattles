Template.mainRoom.helpers({
  inRoom: function() {
    return !! Session.get('currentRoomId');
  },

  loggedIn: function() {
    return !! Meteor.user();
  }
});
