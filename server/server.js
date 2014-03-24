Meteor.startup(function() {
  Rooms.remove({});
  Meteor.users.update({}, { $set: { roomId: 0} }, { multi: true });
});
