define([], function() {
  var ChatController = function() {
    var username;
    var socket;
    return {
      init: function(_username, _socketEmit) {
        username = _username;
        socketEmit = _socketEmit;
      },
      sendMessage: function(message) {
        if (!message) {
          return;
        }
        socketEmit('message', { user: username, message: message});
      }
    };
  };

  return ChatController;
});
