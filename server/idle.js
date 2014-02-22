Meteor.setInterval(function(){
  var time = new Date().getTime() - 6000;
  var expiredUsers = LoggedUsers.find(
    {timestamp: {$lt: time}}
  ).fetch();

  for (var i = 0; i < expiredUsers.length; i++) {
    console.log(expiredUsers[i].username);

    room = Rooms.findOne({users: {$in: [expiredUsers[i].username]}});
    if (room) {
      Rooms.update(
        {_id: room._id},
        {$pull: {users: expiredUsers[i].username}},
        function(e) {
          // Do Nothing
        }
      );

      var message = {
        message: "User " + expiredUsers[i].username + " exited.",
        roomId: room._id,
        user: "System"
      };

      Messages.insert(message);
    }

    room = Rooms.findOne({hostName: expiredUsers[i].username});
    if (room) {
      Messages.remove({roomId: room._id}); 
      Rooms.remove(room);
    }
    LoggedUsers.remove({username: expiredUsers[i].username});
  }

  var loggedUsernames = _.map(
    LoggedUsers.find().fetch(),
    function(user) {
      return user.username;
    }
  );
  Rooms.remove({hostName: {$nin: loggedUsernames}});
}, 3000);


Meteor.methods({
  removeLogged: function(username) {
    LoggedUsers.remove({username: username});
  }
});
