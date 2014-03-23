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
  var chatdiv = document.getElementById("chat-div");
  var scroll = false;

  if (chatdiv != undefined) {
    console.log(chatdiv.scrollHeight + " " +  chatdiv.scrollTop + " " + chatdiv.clientHeight);
    if (chatdiv.scrollHeight - chatdiv.scrollTop - 10 < chatdiv.clientHeight) {
      scroll = true;
    }
  }

  chatCollection.insert({
    user: message.user,
    message: message.text
  }, function(error) {
    if (scroll) {
      chatdiv.scrollTop = chatdiv.scrollHeight - chatdiv.clientHeight;
    }
  });
});
