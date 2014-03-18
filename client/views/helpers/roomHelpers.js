joinRoom = function(roomId) {
  var room = Rooms.findOne({_id: roomId});
  var user = Meteor.user();

  if (room && user) {
    chatCollection.remove({});
    chatCollection.insert({
      user: "System",
      message: "User " + user.username + " has entered the room."
    });

    RoomStream.on(roomId + ':message', function(message) {
      chatCollection.insert({
        user: message.user,
        message: message.text
      });
    });

    RoomStream.on(roomId + ':close', function() {
      if (getRoom()) {
        alert("The host closed the room");
        Meteor.call('exitRemoved', function(error) {
          if (error) {
            throwError(error.reason);
          }
        });
      }
    });
  }
};
