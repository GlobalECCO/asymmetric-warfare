define([], function() {
  var ActionsController = function() {
    var socket;
    return {
      init: function(_socketEmit) {
        socketEmit = _socketEmit;
      },
      endTurn: function() {
        socketEmit('endTurn', null);
      },
      kill: function(position) {
        socketEmit('kill', position.asKey());
      },
      grow: function(position) {
        socketEmit('grow', position.asKey());
      },
      interrogate: function(position) {
        socketEmit('interrogate', position.asKey());
      }
    };
  };

  return ActionsController;
});
