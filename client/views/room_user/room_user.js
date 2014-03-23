Template.roomUser.helpers({
  score: function() {
    var user = Meteor.users.findOne({username: this.toString()}, {fields: {score: true}});
    if (user) {
      return user.score;
    }
    return -1;
  },

  rank: function() {
    var user = Meteor.users.findOne({username: this.toString()}, {fields: {ranking: true}});
    if (user) {
      return user.ranking;
    }
    return -1;
  },

  self: function() {
    return this.toString() === Meteor.user().username;
  }
});
