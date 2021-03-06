define(['lib/constants', 'lib/position', 'lib/insurgent_move', 'lib/state_move'], function(C, Position, InsurgentMove, StateMove) {
  var BasicEntry = function(player, type) {
    return {
      masked: false,
      player: function() {
        return player;
      },
      type: function() {
        return type;
      },
      mask: function() {
        return this;
      }
    };
  };

  var humanise = function(player) {
    return player.charAt(0).toUpperCase() + player.substring(1).toLowerCase();
  };

  var positionKey = function(position) {
    return "<span class='posKey' data-circle='" + position.circle + "' data-rank='" + position.rank + "'>[" + position.asHistoryKey() + "]</span>";
  };

  var Placement = function(player, position) {
    var Placement = BasicEntry(player, C.PLACEMENT);
    Placement.position = function() {
      return position;
    };
    Placement.apply = function(asymwar) {
      if (player === C.INSURGENT) {
        asymwar.addInsurgent(position);
      } else if (player === C.STATE) {
        asymwar.addState(position);
      } else {
        throw "Invalid player value: " + player;
      }
    };
    Placement.toDTO = function() {
      return {
        type: C.PLACEMENT,
        position: position.asKey(),
        player: player
      };
    };
    Placement.mask = function() {
      if (player === C.STATE) {
        return this;
      }

      var Mask = BasicEntry(player, C.PLACEMENT);
      Mask.toDTO = function() {
        return {
          masked: true,
          type: C.PLACEMENT,
          player: player,
          position: null,
          message: humanise(player) + " piece was placed."
        };
      };
      Mask.masked = true;
      return Mask;
    };
    Placement.toString = function() {
      return humanise(player) + " piece placed at " + positionKey(position);
    };
    return Placement;
  };

  var Move = function(player, src, dest) {
    var Move = BasicEntry(player, C.MOVE);
    Move.src = function() {
      return src;
    };
    Move.dest = function() {
      return dest;
    };
    Move.apply = function(asymwar) {
      if (player === C.INSURGENT) {
        asymwar.insurgentMove(src, dest);
      } else if (player === C.STATE) {
        asymwar.stateMove(src, dest);
      } else {
        throw "Invalid player value: " + player;
      }
    };
    Move.toDTO = function() {
      return {
        type: C.MOVE,
        player: player,
        src: src.asKey(),
        dest: dest.asKey()
      };
    };
    Move.mask = function() {
      if (player === C.STATE) {
        return this;
      }

      var Mask = BasicEntry(player, C.MOVE);
      Mask.toDTO = function() {
        return {
          masked: true,
          type: C.MOVE,
          player: player,
          src: null,
          dest: null,
          message: "A " + humanise(player) + " piece was moved."
        };
      };
      Mask.masked = true;
      return Mask;
    };
    Move.toString = function() {
      return humanise(player) + " moved from " + positionKey(src) + " to " + positionKey(dest);
    };
    return Move;
  };

  var Kill = function(player, position) {
    var type = C.KILL;
    var Kill = BasicEntry(player, type);
    Kill.toDTO = function() {
      return {
        type: type,
        player: player,
        position: position.asKey()
      };
    };
    Kill.apply = function(asymwar) {
      asymwar.kill(position);
    };
    Kill.toString = function() {
      return humanise(player) + " killed all the insurgents at " + positionKey(position);
    };
    Kill.position = function() {
      return position;
    };
    return Kill;
  };

  var Interrogate = function(player, position) {
    var type = C.INTERROGATE;
    var Interrogate = BasicEntry(player, type);
    Interrogate.toDTO = function() {
      return {
        type: type,
        player: player,
        position: position.asKey()
      };
    };
    Interrogate.apply = function(asymwar) {
      asymwar.interrogate(position);
    };
    Interrogate.toString = function() {
      return humanise(player) + " interrogated an insurgent at " + positionKey(position);
    };
    Interrogate.position = function() {
      return position;
    };
    return Interrogate;
  };

  var Grow = function(player, position) {
    var type = C.GROW;
    var Grow = BasicEntry(player, type);
    Grow.toDTO = function() {
      return {
        type: type,
        player: player,
        position: position.asKey()
      };
    };
    Grow.apply = function(asymwar) {
      asymwar.grow(position);
    };
    Grow.toString = function() {
      return humanise(player) + " grew at " + positionKey(position);
    };
    Grow.mask = function() {
      var Mask = BasicEntry(player, type);
      Mask.toDTO = function() {
        return {
          masked: true,
          type: type,
          player: player,
          position: null,
          message: "An " + humanise(player) + " piece grew somewhere."
        };
      };
      Mask.masked = true;
      return Mask;
    };
    Grow.position = function() {
      return position;
    };
    return Grow;
  };

  var EndTurn = function(player) {
    var EndTurn = BasicEntry(player, C.END_TURN);
    EndTurn.toDTO = function() {
      return {
        type: C.END_TURN,
        player: player
      };
    };
    EndTurn.apply = function(asymwar) {
      asymwar.endTurn();
    };
    EndTurn.toString = function() {
      return humanise(player) + " ended their turn.";
    };
    return EndTurn;
  };

  var Forfeit = function(player) {
    var Forfeit = BasicEntry(player, C.FORFEIT);
    Forfeit.toDTO = function() {
      return {
        type: C.FORFEIT,
        player: player
      };
    };
    Forfeit.apply = function(asymwar) {
      asymwar.forfeit(player);
    };
    Forfeit.toString = function() {
      return humanise(player) + " forfeit the game.";
    };
    return Forfeit;
  };

  var fromDTO = function(dto) {

    if (!dto.player || (dto.player !== C.STATE && dto.player !== C.INSURGENT)) {
      throw "Invalid player: " + dto.player;
    }

    if (dto.type === C.PLACEMENT) {
      return Placement(dto.player, Position(dto.position));
    } else if (dto.type === C.MOVE) {
      return Move(dto.player, Position(dto.src), Position(dto.dest));
    } else if (dto.type === C.KILL) {
      return Kill(dto.player, Position(dto.position));
    } else if (dto.type === C.INTERROGATE) {
      return Interrogate(dto.player, Position(dto.position));
    } else if (dto.type === C.GROW) {
      return Grow(dto.player, Position(dto.position));
    } else if (dto.type === C.END_TURN) {
      return EndTurn(dto.player);
    } else if (dto.type === C.FORFEIT) {
      return Forfeit(dto.player);
    } else {
      throw "Invalid entry type: "+dto.type;
    }
  };

  return {
    Placement: Placement,
    Move: Move,
    EndTurn: EndTurn,
    Forfeit: Forfeit,
    Kill: Kill,
    Interrogate: Interrogate,
    Grow: Grow,
    fromDTO: fromDTO
  };
});
