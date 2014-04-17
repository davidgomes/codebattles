Template.roomCreate.events({
  'submit form': function(event) {
    event.preventDefault();

    var roomTitle = $(event.target).find('[name=title]').val();
    var roomDiffulty = $(event.target).find('[id=difficulty-selection]').val();

    Meteor.call('room', roomTitle, roomDiffulty, function(error, roomId) {
      if (error) {
        throwError(error.reason);
      } else {
        Router.go('room');
        joinRoom(roomId);
      }
    });
  }
});
