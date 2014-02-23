Template.roomList.helpers({
  roomCount: function() {
    return !! Rooms.find({status: 0}).count();
  },

  rooms: function() {
    return Rooms.find({status: 0});
  },

  isLoggedIn: function() {
    return Meteor.users.find().count() > 0;
  }
});
