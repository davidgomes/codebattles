Meteor.publish('rooms', function() {
  return Rooms.find({ }, { fields: { title: true, users: true, hostName: true,
                                    difficulty: true, status: true } });
});

Meteor.publish('usersLSub', function() {
  return Meteor.users.find({ "status.online": true },
                           { fields: { username: true, score: true, ranking: true } });
});

Meteor.publish('ownUser', function() {
  return Meteor.users.find(this.userId, { fields: { roomId: true } });
});

Meteor.users.deny({
  update: function() {
    return true;
  }
});
