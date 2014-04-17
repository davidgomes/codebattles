Router.configure({
  layoutTemplate: 'layout',
  notFoundTemplate: 'notFound'
});

Router.map(function() {
  this.route('index', {
    path: '/',
    action: function () {
      if (this.ready())
        this.render();
      else
        this.render('loading');
    }
  });

  this.route('room', {
    waitOn: function () {
      return Meteor.subscribe('ownRoom');
    },
    data: function () {
      return Rooms.findOne(Meteor.user().roomId);
    },
    action: function () {
      if (this.ready())
        this.render();
      else
        this.render('loading');
    },
    before: function () {
      if (!Meteor.user() || Meteor.user().roomId == "") {
        Router.go('index');
      }
    }
  });

  this.route('user', {
    path: 'user/:username',
    waitOn: function () {
      return Meteor.subscribe('user', this.params.username);
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
