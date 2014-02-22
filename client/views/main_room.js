Template.mainRoom.helpers({
  inRoom: function() {
    return !! Session.get('currentRoomId');
  }
});
