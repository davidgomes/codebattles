Meteor.publish('rooms', function() {
  return Rooms.find({ status: RoomStatuses.STOPPED }, { fields: { title: true, users: true, hostName: true,
                                                                  difficulty: true, status: true } });
});

Meteor.publish('usersLSub', function() {
  return Meteor.users.find({ "status.online": true },
                           { fields: { username: true, score: true, ranking: true } });
});

Meteor.publish('ownUser', function() {
  return Meteor.users.find(this.userId, { fields: { roomId: true } });
});

Meteor.publish('user', function(_username){
  return Meteor.users.find({ username: _username }, { fields: { roomId: 1 } });
});

Meteor.publish('ownRoom', function(){
  var user = Meteor.users.findOne(this.userId);
  if (user) {
    return Rooms.find(user.roomId, { fields: { title: 1, users: 1, hostName: 1, difficulty: 1, status: 1 } });
  }
  return 0;
});


Meteor.users.deny({
  update: function() {
    return true;
  }
});
