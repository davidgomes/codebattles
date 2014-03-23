Template.mainRoom.helpers({
  inRoom: function() {
    return !! getRoom();
  }
});

getRoom = function () {
  if (Meteor.user()) {
    return Meteor.user().roomId;
  }
  else {
    return 0;
  }
};

chatCollection = new Meteor.Collection(null);
RoomStream = new Meteor.Stream('room_streams');

RoomStream.on('message', function(message) {
  chatCollection.insert({
    user: message.user,
    message: message.text
  });
});

RoomStream.on('close', function() {
  if (getRoom()) {
    alert("The host closed the room");
    Meteor.call('exitRemoved', function(error) {
      if (error) {
        throwError(error.reason);
      }
    });
  }
});
