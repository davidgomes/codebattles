Meteor.publish('rooms', function() {
  return Rooms.find();
});

Meteor.publish('usersLSub', function(){
  return Meteor.users.find();
});

/*Meteor.publish('messages', function(roomId) {
  return Messages.find({roomId: roomId});
});*/
