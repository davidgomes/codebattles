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

    if (roomDifficulty != "easy" && roomDifficulty != "medium" && roomDifficulty != "hard") {
      throw new Meteor.Error(300,  "Invalid difficulty");
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
      user: "System"
    };

    RoomStream.emit('message', room._id, message);

    return room._id;
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
      user: "System"
    };

    RoomStream.emit('message', room._id, message);

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
      user: "System"
    };

    RoomStream.emit('message', roomId, message);

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
