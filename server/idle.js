Meteor.publish (null, function() {
  Meteor.users.find({ "status.online": true }).observe({
    removed: function(user){
      if (user.roomId) {
        var room = Rooms.findOne(user.roomId);
        if (room) {
          Meteor.call('exitFromServer', user.roomId, user._id, function(error, info) {});
        }
      }
    }
  });
});

/* Meteor.setInterval(function() {
  // TODO: Take Care of Ghosts Here
}, 20000); */
