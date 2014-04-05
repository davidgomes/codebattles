Meteor.publish('rooms', function() {
  return Rooms.find({}, { fields: { title: 1, users: 1, hostName: 1, difficulty: 1, status: 1 } });
});

Meteor.publish('usersLSub', function(){
  return Meteor.users.find({ "status.online": true },
                           { fields: { username: 1, score: 1, ranking: 1 } });
});

Meteor.publish('ownUser', function(){
  return Meteor.users.find(this.userId, { fields: { roomId: 1 } });
});

Meteor.users.deny({
  update: function() {
    return true;
  }
});
