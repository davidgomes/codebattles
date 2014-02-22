var nextTime;

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
      message: "Round " + (room.round).toString()  + " started!",
      roomId: roomId,
      user: "System"
    };

    Messages.insert(message);

    var probId = Math.floor((Math.random()*nproblems)+1);
    var problem = problems[probId-1];
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
      message: "Round " + room.round  + " has just finished!",
      roomId: roomId,
      user: "System"
    };

    Messages.insert(message);

    if (room.round === 5) {
      Rooms.update(roomId, {
        $inc: {status: 1}
      });

      var message = {
        message: "Game over! Thanks for playing!",
        roomId: roomId,
        user: "System"
      };

      Messages.insert(message);

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
        message: "Rankings updated.",
        roomId: roomId,
        user: "System"
      };

      Messages.insert(message);
    }
    else {
      Rooms.update(roomId, {
        $inc: {round: 1},
        $set: {startTime: Date.now() + 10 * 1000}
      });

      var message = {
        message: "Round " + (room.round + 1).toString()  + " is about to start! 10 seconds remaining!",
        roomId: roomId,
        user: "System"
      };

      Messages.insert(message);

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
        var score = Math.round(2000 * ((120 + (-Date.now() + room.startTime) / 1000) / 120));
 
        var message = {
          message: "User " + user.username  + " submited the problem for " + score.toString() + " points. Accepted!",
          roomId: roomId,
          user: "System"
        };

        Messages.insert(message);

        Meteor.users.update(userId, {
          $inc: {score: score},
          $set: {lastSub: room.round}
        });

        var sTime = Rooms.findOne(roomId).startTime;
        var timeLeft = Math.round(2 * 60 * 1000 + sTime - Date.now()) / 1000;
        console.log("left: " + timeLeft.toString());
        Rooms.update(roomId, {
          $set: {startTime: Date.now() + Math.min(30, timeLeft) * 1000 - 2 * 60 * 1000}
        });

        Meteor.clearTimeout(nextTime);
        nextTime = Meteor.setTimeout(function() {
          Meteor.call('prepRound', roomId);
        }, Math.min(30, timeLeft) * 1000);

        if (timeLeft >= 30) {
          var message = {
            message: "A User has got an accepted problem, so 30 seconds left!",
            roomId: roomId,
            user: "System"
          };

          Messages.insert(message);          
        }

        return;
      } else if (response === "Wrong Answer") {
        message = {
          message: "User " + user.username  + " submited the problem for 0 points. Wrong Answer!",
          roomId: roomId,
          user: "System"
        };
      } else {
        message = {
          message: "User " + user.username  + " submited the problem for 0 points. Runtime Error! " + response,
          roomId: roomId,
          user: "System"
        };
      }

      Messages.insert(message);
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
