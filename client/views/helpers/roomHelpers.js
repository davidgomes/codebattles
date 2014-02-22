joinRoom = function(roomId) {
  var room = Rooms.findOne({_id: roomId});
  var user = Meteor.user();

  if (room && user) {
/*    Meteor.users.update(
      Meteor.userId(),
      {$set: {roomId: roomId}}
    );*/

    Meteor.call('logInsert', user.username, function(error, roomId) {
      if (error) {
        throwError(error.reason);
      }
    });

    heartBeat = Meteor.setInterval(function(){
      Meteor.call('logUpdate', user.username, function(error, roomId) {
        if (error) {
          throwError(error.reason);
        }
      });
    }, 1000);

    Session.set('currentRoomId', roomId);
  }
};
