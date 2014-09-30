define(['lib/position'], function(Position) {
  var BoardController = function() {
    var socket;
    return {
      init: function(_socketEmit) {
        socketEmit = _socketEmit;
      },
      placeInsurgent: function(circle, rank) {
        socketEmit('placeInsurgent', Position(circle)(rank).asKey());
      },
      insurgentMove: function(src, dest) {
        socketEmit('insurgentMove', { src: src.asKey(), dest: dest.asKey() });
      },
      stateMove: function(src, dest) {
        socketEmit('stateMove', { src: src.asKey(), dest: dest.asKey() });
      }
    };
  };

  return BoardController;
});
