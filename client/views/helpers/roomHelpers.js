joinRoom = function(roomId) {
  var room = Rooms.findOne({ _id: roomId });
  var user = Meteor.user();

  if (room && user) {
    ChatCollection.remove({ });
    ChatCollection.insert({
      user: "System",
      message: "User " + user.username + " has entered the room."
    });
  }
};
