Template.roomItem.helpers({
  userCount: function() {
    return this.users.length + 1;
  }
});

Template.roomItem.events({
  'click .join-button': function(event) {
    event.preventDefault();
    var room = Rooms.findOne({_id: this._id});
    Meteor.call('join', room.title, function(error, roomId) {
      if (error) {
        throwError(error.reason);
      } else {
        joinRoom(roomId);
      }
    });
  }
});
