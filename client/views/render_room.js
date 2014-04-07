var _title = "";
var _titleDeps = new Deps.Dependency;
var _problem = "";
var _problemDeps = new Deps.Dependency;
var language = "python2";
var updateTitleTimer;
var roomTitle;
var roundInfo;
var hotKey = false;
var enterKey = 13;
var altKey = 18;
var escKey = 27;
var chatKey = 77;
var editorKey = 75;

var problem = function() {
  _problemDeps.depend();
  return _problem;
};

var title = function() {
  _titleDeps.depend();
  return _title;
};

var setProblem = function(w) {
  if (_problem !== w) {
    _problem = w;
    _problemDeps.changed();
  }
};

var setTitle = function(w) {
  if (_title !== w) {
    _title = w;
    _titleDeps.changed();
  }
};

function reloadEditor() {
  editor = new CodeMirror(document.getElementById('actual-editor'), {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    mode: 'python',
    theme: 'mbo'
  });

  editor.setSize($("#editor").parent().width() - 100,
                 $(".chat-wrapper").height() + 13);
}

var preRoundTitle = function () {
  var tmptitle = roomTitle;

  tmptitle += " | Round " + roundInfo.number.toString();
  var timeLeft = Math.max(0, Math.round((roundInfo.startTime - Date.now()) / 1000));

  tmptitle += " | " + (timeLeft).toString();
  tmptitle += " to start";

  setTitle(tmptitle);
  updateTitleTimer = Meteor.setTimeout(preRoundTitle, 1000);
};

var roundTitle = function () {
  var tmptitle = roomTitle;

  tmptitle += " | Round " + roundInfo.number.toString();
  var timeLeft = Math.max(0, Math.round((roundInfo.startTime - Date.now()) / 1000));

  tmptitle += " | " + (timeLeft).toString();
  tmptitle += " left";

  setTitle(tmptitle);
  updateTitleTimer = Meteor.setTimeout(roundTitle, 1000);
};


// Event Listener

RoomStream.on("prestart", function(roomId, roundNumber) {
  Meteor.clearTimeout(updateTitleTimer);
  roundInfo = {number: roundNumber, startTime: Date.now() + 10 * 1000};
  preRoundTitle();
  setProblem("");
}); // Pre Round - Time left to start round


RoomStream.on("start", function(roomId, roundTime, statement) {
  Meteor.clearTimeout(updateTitleTimer);
  roundInfo.startTime = Date.now() + roundTime * 1000;
  roundTitle();
  setProblem(statement);
}); // Round Start

RoomStream.on("changeTime", function(roomId, roundTime) {
  Meteor.clearTimeout(updateTitleTimer);
  roundInfo.startTime = Math.min(roundInfo.startTime, Date.now() + roundTime * 1000);
  roundTitle();
}); // Change time left, should be because someone got an AC

RoomStream.on("over", function(roomId) {
  Meteor.clearTimeout(updateTitleTimer);
  setTitle(roomTitle + " | Game Over");
  setProblem("");
}); // Round Over


// Helpers

Template.renderRoom.helpers({
  currentRoom: function() {
    var room = Rooms.findOne(getRoom());

    if (getRoom() && !Rooms.findOne({ _id: getRoom() })) {
      alert("The host closed the room");

      Meteor.call('exitRemoved', function(error) {
        if (error) {
          throwError(error.reason);
        }
      });
    }

    return room;
  },

  userRoom: function() {
    console.log("WS");
    return getRoom();
  },

  messageList: function() {
    return chatCollection.find();
  },

  roomUsers: function() {
    var room = Rooms.findOne(getRoom());
    var usernames = room.users;
    var users = [];
    usernames.push(room.hostName);

    for (var i = 0; i < usernames.length; i++) {
      users.push(Meteor.users.findOne({ username: usernames[i] }));
    }

    users.sort(function(u1, u2) {
      if (u1.score !== u2.score) {
        return u1.score < u2.score;
      }
      return u1.ranking < u2.ranking;
    });

    usernames = [];
    for (var i = 0; i < users.length; i++) {
      usernames.push(users[i].username);
    }

    return usernames;
  },

  roundRunning: function() {
    var room = Rooms.findOne(getRoom());

    return room.status === 1;
  },

  admin: function() {
    var user = Meteor.user();
    var room = Rooms.findOne(getRoom());

    return room.status === 0 && room.hostName === user.username;
  },

  roomTitle: function() {
    return title();
  },

  statement: function() {
    return problem();
  },

  problemFull: function() {
    return problem() !== "";
  }
});


// Page Events

Template.renderRoom.events({
  'click .exit-button': function(event) {
    event.preventDefault();

    if (confirm("Exit Room?")) {
      Meteor.clearTimeout(updateTitleTimer);
      Meteor.call('exit', this.title, function(error) {
        if (error) {
          throwError(error.reason);
        }
      });
    }
  },

  'submit form': function(event) {
    event.preventDefault();

    Meteor.call('sendMessage', $(event.target).find('[name=message]').val(), getRoom(), function(error) {
      if (error) {
        throwError(error.reason);
      } else {
        $(event.target).find('[name=message]').val("");
      }
    });
  },

  'click .submit-button': function(event) {
    event.preventDefault();
    Meteor.call('submit',editor.getValue(),language,Meteor.userId(), getRoom(), function(error) {
    });
  },

  'click .start-button': function(event) {
    event.preventDefault();

    Meteor.call('startGame', getRoom(), function(error) {
      if (error) {
        throwError(error.reason);
      }
    });
  },

  'change #language-selection': function(event) {
    language = document.getElementById('language-selection').value;

    if (language.slice(0, 6) === 'python') {
      editor.setOption('mode', 'python');
    } else if (language === 'ruby') {
      editor.setOption('mode', 'ruby');
    }
  },

  'keydown' : function(event) {
    if (event.keyCode == altKey){
      hotKey = true;
    }
    else if (event.keyCode == escKey){
      if (confirm("Exit Room?")) {
        Meteor.clearTimeout(updateTitleTimer);
        Meteor.call('exit', this.title, function(error) {
          if (error) {
            throwError(error.reason);
          }
        });
      }
    }
  },

  'keydown #message' : function(event) {
    if (hotKey){
      if (event.keyCode == editorKey){
        event.preventDefault();
        editor.focus();
      }
    }
  },

  'keydown #actual-editor' : function(event) {
    if (hotKey){
      if (event.keyCode == enterKey){
        Meteor.call('submit',editor.getValue(),language,Meteor.userId(), getRoom(), function(error) {
        });
      }
      else if (event.keyCode == chatKey){
        event.preventDefault();
        $("#message").focus();
      }
    }
  },

  'keyup #actual-editor' : function(event) {
    if (event.keyCode == altKey){
      hotKey = false;
    }
  }
});


// Meteor Events

Template.renderRoom.rendered = function() {
  editor = undefined;
  Meteor.clearTimeout(updateTitleTimer);
  var room = Rooms.findOne(getRoom());
  roomTitle = room.title;
  setTitle(roomTitle);
  setProblem("");

  if (typeof editor === 'undefined') {
    reloadEditor();
  }
};
