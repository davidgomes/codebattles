var synced = false;

Router.configure({
  layoutTemplate: 'layout',
  notFoundTemplate: 'notFound'
});

Router.map(function() {
  this.route('index', {
    path: '/',
    
    waitOn: function () {
      return [ Meteor.subscribe('rooms'),
               Meteor.subscribe('usersLSub'),
               Meteor.subscribe('ownUser')];
    },
    
    action: function() {
      if (this.ready()) {
        this.render();
      } else {
        this.render('loading');
      }
    }
  });

  this.route('room', {
    path: 'room/:_id',
    
    waitOn: function() {
      return [ Meteor.subscribe('ownUser'),
               Meteor.subscribe('room', this.params._id),
               Meteor.subscribe('usersLSub')];
    },
    
    action: function() {
      if (this.ready()) {
        if (!synced) {
          if (!Meteor.user()) {
            Router.go('index');
          }

          var user = Meteor.user();
          var room = Rooms.findOne(this.params._id);

          if (!room) {
            alert("Room not found");
            synced = true;
            Router.go('index');
            this.stop();
            return;
          }

          if (user.roomId) {
            if (user.roomId !== this.params._id || (!_.contains(room.users, user.username) && room.hostName !== user.username)) {
              Meteor.call('exitFromServer', user.roomId, user._id);
            }

            joinRoom(room._id);
          } else {
            Meteor.call('join', room.title);
          }

          sync();
          synced = true;
        }

        this.render();
      } else {
        synced = false;
        this.render('loading');
      }
    }
  });

  this.route('user', {
    path: 'user/:username',
    
    waitOn: function() {
      return [ Meteor.subscribe('ownUser'),
               Meteor.subscribe('user', this.params.username)];
    },
    
    data: function() {
      return { showUser: Meteor.users.findOne({ username: this.params.username }) };
    },
    
    action: function() {
      if (this.ready()) {
        this.render();
      } else {
        this.render('loading');
      }
    }
  });
});
