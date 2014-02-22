Template.roomCreate.events({
  'submit form': function(event) {
    event.preventDefault();

    var roomTitle = $(event.target).find('[name=title]').val();

    Meteor.call('room', roomTitle, function(error, roomId) {
      if (error) {
        throwError(error.reason);
      } else {
        joinRoom(roomId);
      }
    });
  }
});
