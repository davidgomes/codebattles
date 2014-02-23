Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY'
});

 Accounts.loginServiceConfiguration.insert({
  service: "github",
  clientId: "25ec16dfb8fb5c9c4a4c",
  secret: "e1779a8fc5f168cbb7e8e3f53f23d86799726fa7"
});


Meteor.loginWithGithub({
  requestPermissions: ['user', 'public_repo']
}, function (err) {
  if (err) {
    alert(err.reason || 'Unknown error');
  }
});
