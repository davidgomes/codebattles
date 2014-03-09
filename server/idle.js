Meteor.publish (null, function() {
  Meteor.users.find({ "status.online": true }).observe({
    removed: function(user){
      if (user.roomId) {
        var room = Rooms.findOne(user.roomId);
        if (room) {
          console.log(room.title);
          Meteor.call('exitFromServer', user.roomId, user._id, function(error, info) {
            if (!error && info.closed) {
              RoomStream.emit(info._id + ':close');
            }
          });
        }
      }
    }
  });
});

/* Meteor.setInterval(function() {
  // TODO: Take Care of Ghosts Here
}, 20000); */
