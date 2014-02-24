/* 
 Room Statuses:
   0 - stopped
   1 - running
   2 - ended
*/

Rooms = new Meteor.Collection('rooms');

Rooms.allow({
  insert: function (userId, room) {
    return Meteor.user() && userId === room.hostId && Meteor.user().username === room.hostName && room.users.length === 0 && !Rooms.findOne({title: room.title});
  }
});

Rooms.deny({
  update: function(userId, room, fieldNames) {
    return (_.without(fieldNames, 'users').length > 0) && userId === Meteor.userId();
  }
});

Meteor.methods({
  room: function(roomTitle, roomDifficulty) {
    var user = Meteor.user();
    var roomCopy = Rooms.findOne({title: roomTitle});

    if (!user) {
      throw new Meteor.Error(401, "You need to be logged in to create rooms");
    }

    if (roomTitle.length > 25 || roomTitle.length <= 0) {
      throw new Meteor.Error(422, "The room titles should go from 1 to 25 characters");
    }

    if (roomCopy) {
      throw new Meteor.Error(302,  "There already is a room with that title");
    }

    Meteor.users.update(user._id, {
      $set: {score: 0}
    });

    //prevents injection
    var allowedLevels = ["easy","medium","hard"];
    if (allowedLevels.indexOf(roomDifficulty) === -1) roomDifficulty = "easy";

    var room = {
      title: roomTitle,
      hostId: user._id,
      hostName: user.username,
      status: 0,
      round: 0,
      startTime: 0,
      countTime: 0,
      difficulty: roomDifficulty,
      probNum: -1,

      users: []
    };

    var roomId = Rooms.insert(room);

    var message = {
      message: "User " + user.username + " has entered the room.",
      roomId: roomId,
      user: "System"
    };

    Messages.insert(message);

    return roomId;
  },

  join: function(roomTitle) {
    var user = Meteor.user();
    var room = Rooms.findOne({title: roomTitle});

    if (!user) {
      throw new Meteor.Error(401, "You need to be logged in to join rooms");
    }

    if (!room) {
      throw new Meteor.Error(302,  "Unexistent Room");
    }

    if (room.users.length == 3) {
      throw new Meteor.Error(303,  "Room Full");
    }

    if (room.status !== 0) {
      throw new Meteor.Error(303,  "Game Started");
    }

    Meteor.users.update(user._id, {
      $set: {score: 0}
    });

    Rooms.update({
      _id: room._id
    }, {
      $addToSet: {users: user.username}
    });

    var message = {
      message: "User " + user.username + " has entered the room.",
      roomId: room._id,
      user: "System"
    };

    Messages.insert(message);

    return room._id;
  },

  startGame: function(roomId) {
    if (this.isSimulation) {
      return;
    }

    var user = Meteor.user();
    var room = Rooms.findOne(roomId);

    if (!user) {
      throw new Meteor.Error(401, "You need to be logged in to start rounds");
    }

    if (!room) {
      throw new Meteor.Error(302,  "Unexistent Room");
    }

    if (room.status != 0) {
      throw new Meteor.Error(303,  "Round already started");
    }

    if (room.hostName !== user.username) {
      throw new Meteor.Error(303,  "You are not the host...");
    }

    Rooms.update(room._id, {
      $inc: {status: 1, round: 1},
      $set: {startTime: Date.now() + 10 * 1000, countTime: Date.now() + 10 * 1000}
    });

    var message = {
      message: "Round 1 is about to start! 10 seconds remaining!",
      roomId: room._id,
      user: "System"
    };

    Meteor.users.update(
      {username: {$in: room.users}}, 
      {$set: {lastSub: 0}}
    );

    Meteor.users.update(
      {username: {$in: room.users}}, 
      {$set: {score: 0}}
    );

    Meteor.users.update(
      {username: room.hostName}, 
      {$set: {lastSub: 0}}
    );

    Meteor.users.update(
      {username: room.hostName}, 
      {$set: {score: 0}}
    );

    Messages.insert(message);

    Meteor.setTimeout(function() {
      Meteor.call('startRound', roomId);
    }, 10 * 1000);
  },

  exit: function(roomTitle){
    var room = Rooms.findOne({title: roomTitle});
    var user = Meteor.user();
    
    if (!room) {
      return;
    }

    if (!user) {
      throw new Meteor.Error(401, "You should be logged in to exit a room");
    }

    if (room.hostName == user.username) {
      Rooms.remove(room._id);
      return;
    }

    if (!_.contains(room.users, user.username)) {
      throw new Meteor.Error(301, "You should be in the room to exit the room");
    }

    var message = {
      message: "User " + user.username + " exited.",
      roomId: room._id,
      user: "System"
    };

    Messages.insert(message);

    Rooms.update({title: roomTitle}, {$pull : {users: user.username}});
    LoggedUsers.remove({username: user.username});
  }
});
