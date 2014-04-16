Template.roomList.helpers({
  roomCount: function() {
    return !! Rooms.find({ status: RoomStatuses.STOPPED }).count();
  },

  rooms: function() {
    return Rooms.find({ status: RoomStatuses.STOPPED });
  },

  isLoggedIn: function() {
    return !! Meteor.user();
  }
});
