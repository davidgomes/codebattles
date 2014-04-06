Template.mainRoom.helpers({
  inRoom: function() {
    return !! getRoom();
  }
});

getRoom = function() {
  if (Meteor.user()) {
    return Meteor.user().roomId;
  } else {
    return 0;
  }
};

chatCollection = new Meteor.Collection(null);
RoomStream = new Meteor.Stream('room_streams');

RoomStream.on('message', function(roomId, message) {
  var chatdiv = document.getElementById("chat-div");

  chatCollection.insert({
    user: message.user,
    message: message.text
  });
});

Meteor.autosubscribe(function() {
  chatCollection.find().observe( {
    added: function(item) {
      setTimeout(function() {
        $('#chat-div').scrollTop($('#chat-div')[0].scrollHeight);
      }, 10);
    }
  });
});
