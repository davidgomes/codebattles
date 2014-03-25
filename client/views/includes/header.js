function sign() {  
  var password = $("#password").val();
  var uname = $("#username").val();

  Meteor.loginWithPassword(uname, password, function(error) {
    if (error) {
      throwError(error.reason);
    } else {
      $('#signInModal').modal('hide');
    }
  });
}

Template.header.helpers({
  loggedIn: function() {
    return !! Meteor.user();
  },

  username: function() {
    return Meteor.user().username;
  }
});

Template.header.events({
  'click .logout': function(event) {
    event.preventDefault();
    Meteor.logout();
  },

  'click .sign-in': function(event) {
    event.preventDefault();
    sign();
  },

  'submit form': function(event) {
    event.preventDefault();
    sign();
  }
});
