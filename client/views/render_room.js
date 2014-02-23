var _title = "";
var _titleDeps = new Deps.Dependency;
var _problem = "";
var _problemDeps = new Deps.Dependency;
var locRound = 0;
var bscroll;
var language = "python2";

var problem = function () {
  _problemDeps.depend();
  return _problem;
};

var title = function () {
  _titleDeps.depend();
  return _title;
};

var setProblem = function (w) {
  if (_problem !== w) {
    _problem = w;
    _problemDeps.changed();
  }
};

var setTitle = function (w) {
  if (_title !== w) {
    _title = w;
    _titleDeps.changed();
  }
};

function updateTitle() {
  var room = Rooms.findOne(Session.get('currentRoomId'));

  if (!room) {
    return;
  }

  var tmptitle = room.title;

  if (room.status === 1) {
    tmptitle += " | Round " + room.round.toString();
    var timeLeft = Math.round((room.startTime - Date.now()) / 1000);

    if (timeLeft > 1) {
      $(".code textarea").val("");
    }

    if (timeLeft > 0) {
      setProblem("");
      tmptitle += " | " + (timeLeft).toString();
    } else if (timeLeft + 2 * 60 > 0) {
      tmptitle += " | " + (timeLeft + 2 * 60).toString();

      if (locRound < room.round) {
        locRound = room.round;
      }

      setProblem(room.statement);
    } else {
      tmptitle += " Round Over";
    }
  }

  setTitle(tmptitle);
}

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

function updateScroll() {
  var chatdiv = document.getElementById("chat-div");

  if (chatdiv != undefined) {
    if (chatdiv.scrollHeight - chatdiv.scrollTop >= 350) {
      chatdiv.scrollTop = chatdiv.scrollHeight;
    }
  }
}

Meteor.setInterval(updateTitle, 1000);
Meteor.setInterval(updateScroll, 150);

Template.renderRoom.created = function() {
  updateTitle();
  editor = undefined;
};

Template.renderRoom.helpers({
  currentRoom: function() {
    return Rooms.findOne(Session.get('currentRoomId'));
  },

  userRoom: function() {
    return Meteor.user().roomId;
  },

  messageList: function() {
    return Messages.find({roomId: Session.get('currentRoomId')});
  },

  roomUsers: function() {
    var room = Rooms.findOne(Session.get('currentRoomId'));
    var usernames = room.users, users = [];
    usernames.push(room.hostName);

    for (var i = 0; i < usernames.length; i++) {
      users.push(Meteor.users.findOne({username: usernames[i]}));
    }

    users.sort(function(u1, u2) {
      if (u1.score != u2.score) {
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
    var room = Rooms.findOne(Session.get('currentRoomId'));
    return room.status === 1;
  },

  admin: function() {
    var user = Meteor.user();
    var room = Rooms.findOne(Session.get('currentRoomId'));
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

Template.renderRoom.events({
  'click .exit-button': function(event) {
    event.preventDefault();

    if (confirm("Exit Room?")) {
      Meteor.call('exit', this.title, function(error) {
        if (error) {
          throwError(error.reason);
        } else {
          Meteor.clearInterval(heartBeat);
          Session.set("currentRoomId", 0);
          Meteor.call('removeLogged', Meteor.user().username);
        }
      });
    }
  },

  'submit form': function(event) {
    event.preventDefault();

    Meteor.call('sendMessage', $(event.target).find('[name=message]').val(), Session.get('currentRoomId'), function(error) {
      if (error) {
        throwError(error.reason);
      } else {
        $(event.target).find('[name=message]').val("");

        //scroll down
        var chatdiv = document.getElementById("chat-div");
        chatdiv.scrollTop = chatdiv.scrollHeight;
      }
    });
  },

  'click .submit-button': function(event) {
    event.preventDefault();
    Meteor.call('submit',editor.getValue(),language,Meteor.userId(),Session.get("currentRoomId"),function(error) {
    });
  },

  'click .start-button': function(event) {
    event.preventDefault();

    Meteor.call('startGame', Session.get('currentRoomId'), function(error) {
      if (error) {
        throwError(error.reason);
      }
    });
  },

  'change #language-selection': function(event) {
    language = document.getElementById('language-selection').value;

    if (language.slice(0, 6) === 'python') {
      editor.setOption('mode', 'python');
    } else if (language === 'c' || language === 'cpp') {
      editor.setOption('mode', 'clike');
    }
  }
});

Template.renderRoom.rendered = function() {
  var room = Rooms.findOne(Session.get("currentRoomId"));

  if (room && room.status === 0) {
    setProblem("");
  }

  if (Session.get("currentRoomId") && !Rooms.findOne({_id: Session.get("currentRoomId")})) {
    alert("The host closed the room");
    Session.set("currentRoomId", 0);
  }

  if (typeof editor === 'undefined') {
    reloadEditor();
  }
};

Template.renderRoom.preserve(
  ['.chat-wrapper']
);
