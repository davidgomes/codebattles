Meteor.publish('rooms', function() {
  return Rooms.find();
});

Meteor.publish('usersLSub', function(){
  return Meteor.users.find({"status.online": true }, {fields: {username: 1, score: 1, ranking: 1} });
});

Meteor.publish('ownUser', function(){
  return Meteor.users.find(this.userId, {fields: {roomId: 1}});
});
