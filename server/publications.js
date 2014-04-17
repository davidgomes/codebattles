Meteor.publish('rooms', function() {
  return Rooms.find({ status: 0 }, { fields: { title: 1, users: 1, hostName: 1, difficulty: 1, status: 1 } });
});

Meteor.publish('testUsers', function(){
  return Meteor.users.find({});
});

Meteor.publish('usersLSub', function(){
  return Meteor.users.find({ "status.online": true },
                           { fields: { username: 1, score: 1, ranking: 1 } });
});

Meteor.publish('ownUser', function(){
  return Meteor.users.find(this.userId, { fields: { roomId: 1 } });
});

Meteor.publish('user', function(_username){
  return Meteor.users.find({ username: _username }, { fields: { roomId: 1 } });
});

Meteor.publish('ownRoom', function(){
  var user = Meteor.users.findOne(this.userId);
  if (user) {
    return Rooms.find(user.roomdId, { fields: { title: 1, users: 1, hostName: 1, difficulty: 1, status: 1 } });
  }
  return 0;
});



Meteor.users.deny({
  update: function() {
    return true;
  }
});
