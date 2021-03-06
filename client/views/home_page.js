function sign() {
  var password = $('#password_field').val();
  var password_confirmation = $('#password_confirmation').val();
  var username = $('#username_field').val();

  if (password !== password_confirmation) {
    throwError('Passwords don\'t match!');
    return;
  } else if (!password) {
    throwError('You need to set the password up.');
    return;
  }

  Accounts.createUser({
    username: username,
    password: password
  }, function(error) {
    if (error) {
      throwError(error.reason);
    } else {
      Meteor.loginWithPassword(username, password);
      $('#signUpModal').modal('hide');
    }
  });
}

Template.homePage.events({
  'submit #signUpModal form': function(event) {
    $('.modal-backdrop').remove(); // FIXME Dirty hack to clear the modal backdrop
    event.preventDefault();
    sign();
  }
});
