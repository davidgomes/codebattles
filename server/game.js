RoomStream = new Meteor.Stream('room_streams');

RoomStream.permissions.read(function(eventName, message) {
  if (message && message.roomId) {
    var roomId = message.roomId;
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(this.userId);

    if (user && room) {
      if (room.hostName == user.username || _.contains(room.users, user.username)) {
        return true;
      }
    }
  }
  
  return false;
}, false);

RoomStream.permissions.write(function(eventName, message) {
  if (message && message.roomId) {
    var roomId = message.roomId;
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(this.userId);

    if (!message.user || user.username != message.user) {
      return false;
    }

    if (user && room) {
      if (room.hostName == user.username || _.contains(room.users, user.username)) {
        return true;
      }
    }
  }
  
  return false;
}, false);


var nextTime; // Timeout object for next event

Meteor.methods({
  startRound: function(roomId) {
    if (this.isSimulation) {
      return;
    }

    var room = Rooms.findOne(roomId);

    if (!room) {
      return;
    }

    var message = {
      text: "Round " + (room.round).toString()  + " started!",
      user: "System",
      roomId: roomId
    };

    RoomStream.emit('message', message);

    var problem;
    var probId;
    var difficulty = room.difficulty;
    while(1){
      probId = Math.floor((Math.random()*nproblems)+1);
      problem = problems[probId-1];
      if (problem.difficulty === difficulty) break;
    }

    Rooms.update(roomId,{$set: {statement: problem.statement}});
    Rooms.update(roomId,{$set: {probNum: probId}});

    nextTime = Meteor.setTimeout(function() {
      Meteor.call('prepRound', roomId);
    }, 2 * 60 * 1000);
  },

  prepRound: function(roomId) {
    var room = Rooms.findOne(roomId);

    if (!room) {
      return;
    }

    var message = {
      text: "Round " + room.round  + " has just finished!",
      user: "System",
      roomId: roomId
    };

    RoomStream.emit('message', message);

    if (room.round === 5) {
      Rooms.update(roomId, {
        $inc: {status: 1}
      });

      message = {
        text: "Game over! Thanks for playing!",
        user: "System",
        roomId: roomId
      };

      RoomStream.emit('message', message);

      var users = room.users;
      var ranks = [];
      users.push(room.hostName);
      for (var j = 0; j < users.length; j++) {
        var user = Meteor.users.findOne({username: users[j]});

        var myScore = user.score;
        var myRank = user.ranking;
        var diff = 0, sumS = 0, sumR = 0;

        for (var i = 0; i < users.length; i++) {
          var ouser = Meteor.users.findOne({username: users[i]});
          var scoreI = ouser.score;
          var rankI = ouser.ranking;
          diff += myScore - scoreI;
          sumS += scoreI;
          sumR += rankI;
        }

        var exp = (1 - (myRank / (1 + sumR))) * users.length;
        var real = (1 - (myScore / (1 + sumS))) * users.length;

        var newRank = Math.round(user.ranking + 0.05 * Math.abs(diff) * (exp - real));
        ranks.push(newRank);
      }

      for (var j = 0; j < users.length; j++) {
        Meteor.users.update(
          {username: users[j]},
          {$set: {ranking: ranks[j]}}
        );
      }

      message = {
        text: "Rankings updated.",
        user: "System",
        roomId: roomId
      };

      RoomStream.emit('message', message);
    }
    else {
      Rooms.update(roomId, {
        $inc: {round: 1},
        $set: {startTime: Date.now() + 10 * 1000, countTime: Date.now() + 10 * 1000}
      });

      message = {
        text: "Round " + (room.round + 1).toString()  + " is about to start! 10 seconds remaining!",
        user: "System",
        roomId: roomId
      };

      RoomStream.emit('message', message);

      nextTime = Meteor.setTimeout(function() {
        Meteor.call('startRound', roomId);
      }, 10 * 1000);
    }
  },

  submit: function(code,language,userId,roomId){
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(userId);
 
    if (!user || !room) {
      return;
    }
 
    if (room.status != 1) {
      throw new Meteor.Error(401, "No game running...");
    }
 
    if (user.lastSub >= room.round) {
      throw new Meteor.Error(401, "Already submited in this round...");
    }
 
    if (room.startTime > Date.now()) {
      throw new Meteor.Error(401, "Round hasn't started yet...");
    }

    Meteor.call('runCode', code, language, userId, room.probNum, function(error, response) {
      var message;

      if (response === "Accepted") {
        var score = Math.round(2000 * ((120 + (-Date.now() + room.countTime) / 1000) / 120));
 
        var message = {
          text: "User " + user.username  + " submited the problem for " + score.toString() + " points. Accepted!",
          user: "System",
          roomId: roomId
        };

        RoomStream.emit('message', message);

        Meteor.users.update(userId, {
          $inc: {score: score},
          $set: {lastSub: room.round}
        });

        var sTime = Rooms.findOne(roomId).startTime;
        var timeLeft = Math.round(2 * 60 * 1000 + sTime - Date.now()) / 1000;
        Rooms.update(roomId, {
          $set: {startTime: Date.now() + Math.min(30, timeLeft) * 1000 - 2 * 60 * 1000}
        });

        Meteor.clearTimeout(nextTime);
        nextTime = Meteor.setTimeout(function() {
          Meteor.call('prepRound', roomId);
        }, Math.min(30, timeLeft) * 1000);

        if (timeLeft >= 30) {

          message = {
            text: "A User has got an accepted problem, so 30 seconds left!",
            user: "System",
            roomId: roomId
          };

          RoomStream.emit('message', message);
        }

        return;
      } else if (response === "Wrong Answer") {
        message = {
          text: "User " + user.username  + " submited the problem for 0 points. Wrong Answer!",
          user: "System",
          roomId: roomId
        };
      } else {
        message = {
          text: "User " + user.username  + " submited the problem for 0 points. Runtime Error! " + response,
          user: "System",
          roomId: roomId
        };
      }

      RoomStream.emit('message', message);
    });
  },

  getUserScore: function(username) {
    var user = Meteor.users.find({username: username});
    
    if (!user) {
      return 0;
    }

    return user.score;
  }
});
