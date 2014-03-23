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

    Meteor.users.update(
      user._id,
      {$set: {roomId: roomId}}
    );

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

    Meteor.users.update(
      user._id,
      {$set: {roomId: room._id}}
    );

    var message = {
      text: "User " + user.username + " has entered the room.",
      user: "System",
      roomId: room._id
    };

    RoomStream.emit('message', message);

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
      text: "Round 1 is about to start! 10 seconds remaining!",
      user: "System",
      roomId: roomId
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

    RoomStream.emit('message', message);

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

    var host = room.hostName;

    if (host === user.username) {
      Meteor.users.update(
        user._id,
        {$set: {roomId: 0}}
      );

      var id = room._id;
      Rooms.remove(room._id);
      return;
    }

    if (!_.contains(room.users, user.username)) {
      throw new Meteor.Error(301, "You should be in the room to exit the room");
    }

    Meteor.users.update(
      user._id,
      {$set: {roomId: 0}}
    );

    var message = {
      text: "User " + user.username + " has exited the room.",
      user: "System",
      roomId: room._id
    };

    RoomStream.emit('message', message);

    Rooms.update({title: roomTitle}, {$pull : {users: user.username}});

    return;
  },

  exitFromServer: function(roomId, userId){
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(userId);

    if (!room || !user) {
      return;
    }

    if (room.hostName === user.username) {
      Meteor.users.update(
        userId,
        {$set: {roomId: 0}}
      );

      Rooms.remove(roomId);
      return;
    }

    if (!_.contains(room.users, user.username)) {
      return;
    }

    Meteor.users.update(
      userId,
      {$set: {roomId: 0}}
    );

    var message = {
      text: "User " + user.username + " has exited the room.",
      user: "System",
      roomId: roomId
    };

    RoomStream.emit('message', message);

    Rooms.update({title: room.title}, {$pull : {users: user.username}});

    return;
  },

  exitRemoved: function(){
    var user = Meteor.user();

    if (!user) {
      throw new Meteor.Error(401, "You should be logged in to exit a room");
    }

    Meteor.users.update(
      user._id,
      {$set: {roomId: 0}}
    );
  }
});
