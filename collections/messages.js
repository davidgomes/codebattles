var MESSAGE_MAX_CHARS = 140;

Meteor.methods({
  sendMessage: function(messageText, roomId) {
    if (this.isSimulation) {
      return;
    }
    
    var user = Meteor.user();
    var room = Rooms.findOne({ _id: roomId, users: user.username });

    if (!room) {
      room = Rooms.findOne({ _id: roomId, hostName: user.username });

      if (!room) {
        return;
      }
    }

    if (!user) {
      throw new Meteor.Error(401, 'You need to be logged in to send messages');
    }

    if (messageText.length <= 0) {
      return;
    }

    if (messageText.length > MESSAGE_MAX_CHARS) {
      throw new Meteor.Error(422, 'Messages should have a maximum of ' + MESSAGE_MAX_CHARS +  ' characters');
    }

    var message = {
      text: messageText,
      user: user.username
    };

    RoomStream.emit('message', roomId, message);
  }
});
