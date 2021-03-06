var ROUND_TIME = 120; // Time in seconds for each round
var AFTER_ACCEPTED_TIME = 30; // Time left for other users after first Accepted
var BETWEEN_ROUND_TIME = 5; // Time between rounds

RoomStream = new Meteor.Stream('room_streams');

RoomStream.permissions.read(function(eventName, roomId, arg1) {
  // if event is a message then arg1 is the message hash

  if (roomId) {
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(this.userId);

    if (user && room) {
      if (room.hostName === user.username || _.contains(room.users, user.username)) {
        return true;
      }
    }
  }

  return false;
}, false);

RoomStream.permissions.write(function(eventName, roomId, arg1) {
  // if event is a message then arg1 is the message hash

  if (roomId && eventName === 'message') {
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(this.userId);

    if (!arg1.user || user.username !== arg1.user) {
      return false;
    }

    if (user && room) {
      if (room.hostName === user.username || _.contains(room.users, user.username)) {
        return true;
      }
    }
  }

  return false;
}, false);


/*
 Game Methods:
 - startGame    : Start a new Game
 - startRound   : Start current round
 - prepRound    : Finish previous round and setup BETWEEN_ROUND_TIME seconds to next or game over
 - submit       : User code submit
 */

var nextTime; // Timeout object for next event

Meteor.methods({
  startGame: function(roomId) {
    if (this.isSimulation) {
      return;
    }

    var user = Meteor.user();
    var room = Rooms.findOne(roomId);

    if (!user) {
      throw new Meteor.Error(401, 'You need to be logged in to start rounds');
    }

    if (!room) {
      throw new Meteor.Error(302, 'Unexistent Room');
    }

    if (room.status !== RoomStatuses.STOPPED) {
      throw new Meteor.Error(303, 'Round already started');
    }

    if (room.hostName !== user.username) {
      throw new Meteor.Error(303, 'You are not the host...');
    }

    Rooms.update(room._id, {
      $set: { startTime: Date.now() + BETWEEN_ROUND_TIME * 1000 }
    });

    Rooms.update(room._id, {
      $inc: { status: 1 }
    });

    Rooms.update(room._id, {
      $set: { countTime: Date.now() + BETWEEN_ROUND_TIME * 1000 }
    });

    Meteor.users.update(
      { username: { $in: room.users } },
      { $set: { lastSub: 0 }}
    );

    Meteor.users.update(
      { username: { $in: room.users } },
      { $set: { score: 0 } }
    );

    Meteor.users.update(
      { username: room.hostName },
      { $set: { lastSub: 0 } }
    );

    Meteor.users.update(
      { username: room.hostName },
      { $set: { score: 0 } }
    );

    Meteor.call('prepRound', roomId);
  },

  startRound: function(roomId) {
    if (this.isSimulation) {
      return;
    }

    var room = Rooms.findOne(roomId);

    if (!room) {
      return;
    }

    var message = {
      text: 'Round ' + (room.round).toString()  + ' started!',
      user: 'System'
    };

    RoomStream.emit('message', roomId, message);

    var problem;
    var probId;
    var difficulty = room.difficulty;

    do {
      probId = Math.floor((Math.random() * nproblems) + 1);
      problem = problems[probId - 1];
    } while (problem.difficulty !== difficulty);

    Rooms.update(roomId, { $set: { probNum: probId } });
    RoomStream.emit('start', roomId, ROUND_TIME, problem.statement);

    nextTime = Meteor.setTimeout(function() {
      Meteor.call('prepRound', roomId);
    }, ROUND_TIME * 1000);
  },

  prepRound: function(roomId) {
    if (this.isSimulation) {
      return;
    }

    var room = Rooms.findOne(roomId);

    if (!room) {
      return;
    }

    if (room.round > 0) {
      var message = {
        text: 'Round ' + room.round  + ' has just finished!',
        user: 'System'
      };

      RoomStream.emit('message', roomId, message);
    }

    if (room.round === 5) {
      Rooms.update(roomId, {
        $set: { status: RoomStatuses.STOPPED }
      });

      Rooms.update(roomId, {
        $set: { round: 0 }
      });

      message = {
        text: 'Game over! Thanks for playing!',
        user: 'System'
      };

      RoomStream.emit('message', roomId, message);
      RoomStream.emit('over', roomId);

      var users = room.users;
      var ranks = [];
      users.push(room.hostName);

      for (var j = 0; j < users.length; j++) {
        var user = Meteor.users.findOne({ username: users[j] });

        var myScore = user.score;
        var myRank = user.ranking;
        var diff = 0, sumS = 0, sumR = 0;

        for (var i = 0; i < users.length; i++) {
          var ouser = Meteor.users.findOne({ username: users[i] });
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
          { username: users[j] },
          { $set: { ranking: ranks[j] } }
        );
      }

      message = {
        text: 'Rankings updated.',
        user: 'System'
      };

      RoomStream.emit('message', roomId, message);
    } else {
      Rooms.update(roomId, {
        $inc: { round: 1 },
        $set: { startTime: Date.now() + BETWEEN_ROUND_TIME * 1000,
                countTime: Date.now() + BETWEEN_ROUND_TIME * 1000,
                probNum: -1 }
      });

      Rooms.update(roomId, {
        $set: { acceptedUsers: 0 }
      });

      message = {
        text: 'Round ' + (room.round + 1).toString()  + ' is about to start! ' + BETWEEN_ROUND_TIME + ' seconds remaining!',
        user: 'System'
      };

      RoomStream.emit('message', roomId, message);
      RoomStream.emit('prestart', roomId, room.round + 1, BETWEEN_ROUND_TIME);

      nextTime = Meteor.setTimeout(function() {
        Meteor.call('startRound', roomId);
      }, BETWEEN_ROUND_TIME * 1000);
    }
  },

  submit: function(code, language, userId, roomId) {
    var room = Rooms.findOne(roomId);
    var user = Meteor.users.findOne(userId);

    if (this.isSimulation) {
      return;
    }

    if (!user || !room) {
      return;
    }

    if (user._id !== userId) {
      return;
    }

    if (room.status !== RoomStatuses.RUNNING) {
      throw new Meteor.Error(401, 'No game running...');
    }

    if (user.lastSub >= room.round) {
      throw new Meteor.Error(401, 'Already submited in this round...');
    }

    if (room.startTime > Date.now()) {
      throw new Meteor.Error(401, 'Round hasn\'t started yet...');
    }

    Meteor.call('runCode', code, language, userId, room.probNum, function(error, response) {
      var room = Rooms.findOne(roomId);
      var message;

      if (response === 'Accepted' || code == 'xxx') {
        var score = Math.round(2000 * ((ROUND_TIME + (-Date.now() + room.countTime) / 1000) / ROUND_TIME));

        var message = {
          text: 'User ' + user.username  + ' submited the problem for ' + score.toString() + ' points. Accepted!',
          user: 'System'
        };

        RoomStream.emit('message', roomId, message);

        Meteor.users.update(userId, {
          $inc: { score: score },
          $set: { lastSub: room.round }
        });

        var startTime = Rooms.findOne(roomId).startTime;
        var timeLeft = Math.round(ROUND_TIME * 1000 + startTime - Date.now()) / 1000;

        Rooms.update(roomId, {
          $inc: { acceptedUsers: 1 },
          $set: { startTime: Date.now() + Math.min(AFTER_ACCEPTED_TIME, timeLeft) * 1000 - ROUND_TIME * 1000 }
        });

        var room = Rooms.findOne(roomId);
        if (room.acceptedUsers === (1 + room.users.length)) {
          Meteor.clearTimeout(nextTime);
          Meteor.call('prepRound', roomId);
          return;
        }

        Meteor.clearTimeout(nextTime);

        nextTime = Meteor.setTimeout(function() {
          Meteor.call('prepRound', roomId);
        }, Math.min(AFTER_ACCEPTED_TIME, timeLeft) * 1000);

        if (timeLeft >= AFTER_ACCEPTED_TIME) {
          message = {
            text: 'A User has got an accepted problem, so ' + AFTER_ACCEPTED_TIME + ' seconds left!',
            user: 'System'
          };

          RoomStream.emit('message', roomId, message);
          RoomStream.emit('changeTime', roomId, AFTER_ACCEPTED_TIME);
        }

        return;
      } else if (response === 'Wrong Answer') {
        message = {
          text: 'User ' + user.username + ' submited the problem for 0 points. Wrong Answer!',
          user: 'System',
          roomId: roomId
        };
      } else {
        message = {
          text: 'User ' + user.username + ' submited the problem for 0 points. Runtime Error! ' + response,
          user: 'System'
        };
      }

      RoomStream.emit('message', roomId, message);
    });
  },

  getRoundInfo: function() {
    if (this.isSimulation) {
      return null;
    }

    var user = Meteor.user();

    if (!user) {
      throw new Meteor.Error(303, 'You need to be logged in.');
    }

    var room = Rooms.findOne(user.roomId);

    if (!room) {
      throw new Meteor.Error(303, 'You need to be in a room.');
    }

    var wrappedInfo = { status: room.status };
    if (room.status === RoomStatuses.RUNNING) {
      wrappedInfo.round = room.round;

      if (room.probNum !== -1) {
        wrappedInfo.statement = problems[room.probNum - 1].statement;
        wrappedInfo.roundTime = Math.round(ROUND_TIME * 1000 + room.startTime - Date.now()) / 1000;
        wrappedInfo.preRound = false;
      } else {
        wrappedInfo.roundTime = Math.round(BETWEEN_ROUND_TIME * 1000 + room.startTime - Date.now()) / 1000;
        wrappedInfo.preRound = true;
      }
    }

    return wrappedInfo;
  }
});
