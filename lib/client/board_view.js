define(['underscore', 'allong.es', 'lib/constants', 'lib/position', 'lib/insurgent_move', 'lib/state_move'],
    function(_, allong, C, Position, InsurgentMove, StateMove) {

  var DEST_STROKE = "FF7F00";
  var DEST_FILL = "883800";

  function $findSpace(position) {
    return $("#space"+position.circle+"-"+position.rank).first();
  };

  function clearGhost(position) {
    $("#marker"+position.circle+"-"+position.rank + " .ghost").remove();
  };

  function modifyHighlight($space, strokeColour, fillColour) {
    var data = $space.data('maphilight') || {};
    data.alwaysOn = true;
    data.fill = true;
    data.stroke = true;
    data.strokeColor = strokeColour;
    data.fillColor = fillColour;
    $space.data('maphilight', data).trigger('alwaysOn.maphilight');
    $space.removeAttr('nohref');
    $space.attr('href', '#');
  };

  function highlightSpace($space) {
    modifyHighlight($space, "00FF00", "008800");
  };

  function markSelected($space) {
    modifyHighlight($space, "FF0000", "880000");
  };

  function markVisible($space) {
    modifyHighlight($space, "FFFF00", "888800");
  };

  function markHighlightedAndVisible($space) {
    modifyHighlight($space, "AAFF33", "FFFF00");
  };

  function setTransitionProperty($element, value) {
    $element.css('transition', value);
    $element.css('webkitTransition', value);
    $element.css('mozTransition', value);
    $element.css('oTransition', value);
  }

  function clearTransitionProperty($element) {
    $element.css('transition', '');
    $element.css('webkitTransition', '');
    $element.css('mozTransition', '');
    $element.css('oTransition', '');
  }

  function setTextAndFlashOutline($overlay, $flash, text) {
    text = text || "";
    if ($overlay.text() == text) {
      return;
    }
    var oldBackground = $overlay[0].style.background;
    var timeout = 450;
    $overlay.text(text);
    setTransitionProperty($flash, 'background ' + timeout + 'ms');
    $flash.css('background', '#AA3377');
    setTimeout(function() {
      $flash.css('background', oldBackground);
      setTimeout(function() {
        clearTransitionProperty;
      }, timeout);
    }, timeout);
  }

  var BoardView = function() {
    var $board;
    var $wrapper;
    var controller;
    var role, board, currentPhase, currentTurn, remainingMovementPoints;

    var clearSelectionHandler = function(e) {
      if (!role || !board) {
        throw "Trying to clear selection, but no game data received yet.";
      }
      clearSelected();
      render(role, board, currentPhase, currentTurn, remainingMovementPoints);
    };

    var clearListeners = function() {
      $spaces = $(".space").off('click');
    };

    var clearSelected = function() {
      //Remove hilight from all maphilights
      $spaces = $(".space");
      $spaces.each(function(index, space) {
        var $space = $(space);
        var data = $space.data('maphilight') || {};
        data.alwaysOn = false;
        data.fill = false;
        data.stroke = false;
        $space.data('maphilight', data).trigger('alwaysOn.maphilight');
        $space.removeAttr('href');
        $space.attr('nohref', 'nohref');
        $space.off('click');
      });
    };

    var displayInsurgentPlacements = function() {

      var positions = [];
      _.times(C.NUM_RANKS, function(i) {
        positions.push(Position(0)(i));
      });

      _.each(positions, function(position) {
        var $space = $findSpace(position);
        highlightSpace($space);
        $space.on('click', function(e) {
          clearSelected();
          clearListeners();
          e.stopPropagation();
          controller.placeInsurgent(position.circle, position.rank);
        });
      });
    };

    var displayMovablePieces = function(Move, board, role, currentTurn, remainingMovementPoints, controllerMethod, adjacentSrcFilterMaker) {
      clearSelected();
      var positions = board.getPositionsByType(currentTurn);

      if (!adjacentSrcFilterMaker) {
        adjacentSrcFilterMaker = function(src) { return function(dest) { return true }; };
      }

      _.each(positions, function(src) {
        var $space = $findSpace(src);
        if (role === C.INSURGENT && board.getInsurgentPiecesAt(src).length > 1) {
          markHighlightedAndVisible($space);
        } else {
          highlightSpace($space);
        }
        $space.on('click', function(e) {
          e.stopPropagation();
          $(".space").off('click');
          clearSelected();
          clearListeners();
          markSelected($space);
          var adjacentPositions = _.chain(src.adjacentPositions())
            .filter(function(dest) {
              return src.distanceTo(dest) <= remainingMovementPoints;
            })
            .filter(function(dest) {
              try {
                Move(src)(dest);
                return true;
              } catch (e) {
                if (e === "Invalid move") {
                  return false;
                }
                throw e;
              }
            })
            .filter(adjacentSrcFilterMaker(src))
            .value();
          _.each(adjacentPositions, function(dest) {
            var $destSpace = $findSpace(dest);
            var distance = src.distanceTo(dest);
            var _class;
            if (distance === 1) {
              _class = "short_move";
            } else {
              _class = "long_move";
            }
            $destSpace.addClass(_class);
            modifyHighlight($destSpace, DEST_STROKE, DEST_FILL);
            $destSpace.on('click', function(e) {
              e.stopPropagation();
              clearSelected();
              clearListeners();
              controllerMethod(src, dest);
            });
          });
        });
      });
    };

    var displayMovableInsurgents = function(board, role, currentTurn, remainingMovementPoints) {
      displayMovablePieces(InsurgentMove, board, role, currentTurn, remainingMovementPoints, controller.insurgentMove);
    };

    var displayMovableStatePieces = function(board, role, currentTurn, remainingMovementPoints) {
      var statePiecesInInnerCircle = _.chain(board.getPieces())
        .map(function(piecesAt, poskey) {
          var position = Position(poskey);
          if (position.circle === C.INNER_CIRCLE) {
            return _.filter(piecesAt, function(piece) { return piece.type() === C.STATE; });
          }
        })
        .compact()
        .flatten()
        .value();

      var innerCircleFilterMaker = function(src) {
        return function(dest) {
          console.log("Filtering src: ", src);
          console.log("Filtering dest: ", dest);

          if (statePiecesInInnerCircle.length >= C.MAX_STATE_PIECES_IN_INNER_CIRCLE)
          if (src.circle !== (C.INNER_CIRCLE))
          if (dest.circle === (C.INNER_CIRCLE)) {
            return false;
          }
          return true;
        };
      };
      displayMovablePieces(StateMove, board, role, currentTurn, remainingMovementPoints, controller.stateMove, innerCircleFilterMaker);
    };

    var showCandidates = function(positions, handler) {
      clearSelected();
      _.each(positions, function(position) {
        var $space = $findSpace(position);
        highlightSpace($space);
        $space.on('click', function(e) {
          e.stopPropagation();
          handler(position);
          clearSelected();
        });
      });
    };

    var containsOneOfEach = function(board, position) {
      if (_.find(board.getPiecesAt(position), function(piece) { return piece.type() === C.STATE; }))
      if (_.find(board.getPiecesAt(position), function(piece) { return piece.type() === C.INSURGENT; })) {
        return true;
      }
      return false;
    };

    /*
     * $wrapper must be an element. It will have a click handler attached to it
     * that will clear the selection in this view. Usually that element should
     * wrap the board, and provides a way for the player to deselect what they
     * have selected.
     */
    var init = function($container, _controller, $_wrapper) {
      $board = $container;
      $wrapper = $_wrapper;
      controller = _controller;
      $selection_map = $("#selection_map"); //handles selections. also hilights
      $board = $("#board"); //shows pieces on the board

      var CIRCLES = C.NUM_CIRCLES;
      var SPACES_PER_CIRCLE = C.NUM_RANKS;
      var CAPITAL_INDEX = C.CAPITAL;

      function createSpace(circle, rank) {
        var $template = ich.piecemarker({
          rank: rank,
          circle: circle,
          rotate: circle === 4 ? 0 : (rank + Math.floor(circle/2)) % 12,
          half: circle % 2 === 1 ? "-5" : ""
        });
        $board.append($template);
      };

      for (var circle_index = 0; circle_index < CIRCLES-1; circle_index++) {
        for (var rank_index = 0; rank_index < SPACES_PER_CIRCLE; rank_index++) {
          createSpace(circle_index, rank_index);
        }
      }
      createSpace(4, 0);
      $('#selection_layer').maphilight({
        fade: false,
        fill: false,
        stroke: false,
        alwaysOn: false,
        fillOpacity: 0.3,
        strokeWidth: 3,
        strokeColor: '00FF00',
        wrapClass: 'board_position'
      });

      $wrapper.on('click', clearSelectionHandler);
    };

    var render = function(role, board, currentPhase, currentTurn, remainingMovementPoints) {
      clearSelected(); // This clears all visibility markers too
      clearListeners();
      $('#board .pieces').empty();
      _.each(board.getPieces(), function(pieces_here, poskey) {
        var position = Position(poskey);
        var groups = _.groupBy(pieces_here, function(piece) { return piece.type() });
        var $marker = $("#marker"+position.circle+"-"+position.rank + " .pieces").first();
        $marker.empty();

        _.each(groups[C.STATE], function(piece) {
          var $piece = ich.piece({type: C.STATE});
          $marker.append($piece);
        });
        _.each(groups[C.INSURGENT], function(piece) {
          var $piece = ich.piece({type: C.INSURGENT});
          $marker.append($piece);
        });
        if ($marker.children().length > 0) {
          clearGhost(position);
        }
        if (role === C.INSURGENT && groups[C.INSURGENT] && groups[C.INSURGENT].length > 1) {
          //This space is visible to the State player. Mark it as such.
          markVisible($findSpace(position));
        }
      });

      if (currentPhase === C.SETUP && role === C.INSURGENT) {
        displayInsurgentPlacements();
      } else if (currentPhase === C.PLAYING) {
        var displayMovablePieces = function() {
          if (remainingMovementPoints > 0) {
            if (currentTurn === C.INSURGENT && role === C.INSURGENT) {
              displayMovableInsurgents(board, role, currentTurn, remainingMovementPoints);
            } else if (currentTurn === C.STATE && role === C.STATE) {
              displayMovableStatePieces(board, role, currentTurn, remainingMovementPoints);
            }
          }
        }
        $board.on('click', function() {
          clearSelected();
          displayMovablePieces();
        });
        displayMovablePieces();
      }
    };

    var revealInsurgents = function(positions) {
      _.chain(positions)
        .map(function(position) { return position.asKey(); }) // Convert to poskeys so we can run uniq() successfully
        .uniq()
        .map(function(poskey) { return Position(poskey); })
        .each(function(position) {
          var $content = $("#marker"+position.circle+"-"+position.rank + " .content").first();
          clearGhost(position);
          var $ghost = ich.ghost();
          $content.append($ghost);
        });
    };

    return {
      init: init,
      render: function(_role, _board, _currentPhase, _currentTurn, _remainingMovementPoints) {
        role = _role;
        board = _board;
        currentPhase = _currentPhase;
        currentTurn = _currentTurn;
        remainingMovementPoints = _remainingMovementPoints;
        render(role, board, currentPhase, currentTurn, remainingMovementPoints);
      },
      revealInsurgents: revealInsurgents,
      showKillCandidates: function(board, controller) {
        clearSelected();
        var positions = _.filter(board.getPositionsByType(C.STATE), allong.es.call(containsOneOfEach, board));
        showCandidates(positions, function(position) {
          controller.kill(position);
        });
      },
      showTurnCandidates: function(board, controller) {
        clearSelected();
        var positions = _.filter(board.getPositionsByType(C.STATE), allong.es.call(containsOneOfEach, board));
        showCandidates(positions, function(position) {
          controller.interrogate(position);
        });
      },
      showGrowCandidates: function(board, controller) {
        clearSelected();
        var positions = _.chain(board.getPositionsByType(C.INSURGENT))
          .filter(function(position) { // Only select positions with multiple insurgents
            return board.getInsurgentPiecesAt(position).length > 1;
          })
          .map(function(position) { //Collect up all insurgent positions and their adjacencies
            return [position].concat(position.adjacentPositions());
          })
          .reduce(function(memo, positions) { return memo.concat(positions); }, []) // Squash them down to one array
          .uniq(false, function(position) { return position.asKey(); }) //determine uniqueness based on keys
          .value();
        showCandidates(positions, function(position) {
          controller.grow(position);
        });
      }
    };
  };

  return BoardView;
});
