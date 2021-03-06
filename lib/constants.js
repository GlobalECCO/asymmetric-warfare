define([], function() {
  var C = {};
  C.NUM_RANKS = 12;
  C.NUM_CIRCLES = 5;
  C.CAPITAL = 4;
  C.INNER_CIRCLE = 3;
  C.OUTER_CIRCLE = 0;

  C.MAX_STATE_PIECES_IN_INNER_CIRCLE = 3;
  C.MAX_INSURGENTS = 15;

  C.INSURGENT = "insurgent";
  C.STATE = "state";

  C.INITIAL_INSURGENTS = 5;
  C.INITIAL_STATE_PIECES = 5;

  C.INTERROGATE_REVEAL_DURATION = 4;

  C.MOVEMENT_POINTS = 2;

  C.PLACEMENT = "PLACEMENT";
  C.MOVE = "MOVE";
  C.END_TURN = "END_TURN";
  C.KILL = "KILL";
  C.INTERROGATE = "INTERROGATE";
  C.GROW = "GROW";
  C.FORFEIT = "FORFEIT";

  C.SETUP = "SETUP";
  C.PLAYING = "PLAYING";
  C.GAMEOVER = "GAMEOVER";

  return C;
});
