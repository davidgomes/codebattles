function sign() {  
  var password = $("#password_field").val();
  var password_confirmation = $("#password_confirmation").val();
  var uname = $("#username_field").val();

  if (password !== password_confirmation) {
    throwError("Passwords don't match!");
    return;
  }
  else if (!password) {
    throwError("You need to set the password up.");
    return;
  }

  Accounts.createUser({
    username: uname,
    password: password
  }, function(error) {
    if (error) {
      throwError(error.reason);
    }
    else {
      Meteor.loginWithPassword(uname, password);
      $('#signUpModal').modal('hide');
    }
  });
}

Template.renderSignup.events({
  'click .sign-up': function(event) {
    event.preventDefault();
    sign();
  },
  'submit form': function(event) {
    event.preventDefault();
    sign();
  }
});
