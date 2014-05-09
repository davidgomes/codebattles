var synced = false;

Router.configure({
  layoutTemplate: 'layout',
  notFoundTemplate: 'notFound'
});

Router.map(function() {
  this.route('index', {
    path: '/',
    waitOn: function () {
      return [Meteor.subscribe('rooms'), Meteor.subscribe('usersLSub'), Meteor.subscribe('ownUser')];
    },
    action: function () {
      if (this.ready())
        this.render();
      else
        this.render('loading');
    },
    before: function () {
      if (Meteor.user() && !Meteor.user().roomId == "") {
        Router.go('room');
      }
    }
  });

  this.route('room', {
    waitOn: function () {
      return [Meteor.subscribe('ownRoom'), Meteor.subscribe('ownUser'), Meteor.subscribe('usersLSub')];
    },
    action: function () {
      if (this.ready()) {
        if (!Meteor.user() || Meteor.user().roomId == "") {
          Router.go('index');
        }
        
        if (!synced) {
          sync();
          synced = true;
        }
        this.render();
      }
      else {
        synced = false;
        this.render('loading');
      }
    }
  });

  this.route('user', {
    path: 'user/:username',
    waitOn: function () {
      return [Meteor.subscribe('ownUser'), Meteor.subscribe('user', this.params.username)];
    },
    data: function () {
      return { showUser: Meteor.users.findOne({ username: this.params.username }) };
    },
    action: function () {
      if (this.ready())
        this.render();
      else
        this.render('loading');
    }
  });
});