define(['underscore', 'allong.es', 'lib/constants', 'lib/position', 'lib/insurgent_move', 'lib/state_move'],
    function(_, allong, C, Position, InsurgentMove, StateMove) {

  var isPlayback = false;

  var darkGreen = '1F4C0F';
  var medGreen = '52CC29';
  var lightGreen = 'C2FFAD';

  function decToHex(dec) {
    var hex = dec.toString(16);
    return hex.length === 1? "0" + hex: hex;
  };

  function hexToDec(hex) {
    return Math.max(0, Math.min(parseInt(hex, 16), 255));
  };

  function colorDecToHex(red, green, blue) {
    var result = decToHex(red) + decToHex(green) + decToHex(blue);
    return result;
  };

  function colorHexToDec(color) {
    if (typeof color === 'string' && color.length === 6) {
      return [hexToDec(color.substr(0,2)),
              hexToDec(color.substr(2,2)),
              hexToDec(color.substr(4,2))];
    } else {
      return undefined;
    }
  };

  function lerp(fromValue, toValue, alpha) {
    return fromValue * (1 - alpha) + toValue * alpha;
  }

  function colorLerp(fromColor, toColor, alpha) {
    fromColor = colorHexToDec(fromColor);
    toColor = colorHexToDec(toColor);

    if (!fromColor || !toColor) {
      return toColor;
    }

    var result = [];
    for (var colorIndex = 0; colorIndex < 3; ++colorIndex) {
      var color = lerp(fromColor[colorIndex], toColor[colorIndex], alpha);
      result[colorIndex] = Math.floor(color);
    }
    return colorDecToHex(result[0], result[1], result[2]);
  };

  function $findSpace(position) {
    return $("#space" + position.circle + "-" + position.rank).first();
  };

  function clearGhost(position) {
    $("#marker" + position.circle + "-" + position.rank + " .ghost").remove();
  };

  function spaceHandler($space, callback) {
    if (!isPlayback) {
      $space.on('click', callback);
      $space.removeAttr('nohref');
      $space.attr('href', '#');

      var data = $space.data('maphilight') || {};
      data.clickHandler = callback;
    }
  }

  function setupHighlightTransitions() {
    var intervalTime = 50;
    setInterval(function() {
      $spaces = $(".space");
      $spaces.each(function(index, space) {
        $space = $(space);
        var data = $space.data('maphilight') || {};
        if (data.alwaysOn && data.start && data.end) {

          var alpha = data.elapsed / data.end.duration;
          data.elapsed += intervalTime;

          var finished = data.elapsed >= data.end.duration;

          // Lerp all values
          if (!finished) {
            data.strokeColor = colorLerp(data.start.strokeColor, data.end.strokeColor, alpha);
            data.fillColor = colorLerp(data.start.fillColor, data.end.fillColor, alpha);
            data.strokeOpacity = lerp(data.start.strokeOpacity, data.end.strokeOpacity, alpha);
            data.fillOpacity = lerp(data.start.fillOpacity, data.end.fillOpacity, alpha);
            data.strokeWidth = lerp(data.start.strokeWidth, data.end.strokeWidth, alpha);
          } else {
            data.strokeColor = data.end.strokeColor;
            data.fillColor = data.end.fillColor;
            data.strokeOpacity = data.end.strokeOpacity;
            data.fillOpacity = data.end.fillOpacity;
            data.strokeWidth = data.end.strokeWidth;
          }

          data.stroke = data.strokeColor && data.strokeOpacity? true: false;
          data.fill = data.fillColor && data.fillOpacity? true: false;

          $space.data('maphilight', data).trigger('alwaysOn.maphilight');

          if (finished) {
            if (!data.stroke && !data.fill) {
              data.alwaysOn = false;
            }

            if (typeof data.end.onFinished === 'function') {
              data.end.onFinished();
            }
          }
        }
      });
    }, intervalTime);
  }

  function modifyHighlight($space, params, override) {
    var data = $space.data('maphilight') || {};
    var start = {};
    if (data.strokeOpacity > 0) {
      start.strokeColor = data.strokeColor;
      start.strokeOpacity = data.strokeOpacity;
    } else {
      start.strokeColor = params.strokeColor;
      start.strokeOpacity = 0;
    }

    if (data.fillOpacity > 0) {
      start.fillColor = data.fillColor;
      start.fillOpacity = data.fillOpacity;
    } else {
      start.fillColor = params.fillColor;
      start.fillOpacity = 0;
    }

    start.strokeWidth = data.strokeWidth;

    var end = {};
    end.onFinished = params.onFinished || undefined;
    end.strokeColor = params.strokeColor || start.strokeColor;
    end.fillColor = params.fillColor || start.fillColor;
    end.strokeOpacity = params.hasOwnProperty('strokeOpacity')? params.strokeOpacity: 1;
    end.fillOpacity = params.hasOwnProperty('fillOpacity')? params.fillOpacity: 0.5;
    end.strokeWidth = params.hasOwnProperty('strokeWidth')? params.strokeWidth: 5;
    end.duration = params.duration? params.duration: 1;

    if (!override && data.hasOwnProperty('override')) {
      data.override.end = end;
    } else {
      data.alwaysOn = start.strokeOpacity > 0 || start.fillOpacity > 0 || end.strokeOpacity > 0 || end.fillOpacity > 0;
      data.start = start;
      data.end = end;

      if (override && !data.hasOwnProperty('override')) {
        data.override = {};
        data.override.wasOn = false;
      }
    }
    data.elapsed = 0;
    $space.data('maphilight', data);
  };

  function flashHighlight($space, paramList, fadeIn, override) {
    var data = $space.data('highlightAnim') || {};
    var currentIndex = 0;

    var cycleNextCallback = function() {
      currentIndex++;
      if (currentIndex >= paramList.length) {
        currentIndex = 0;
      }
      modifyHighlight($space, paramList[currentIndex], override);
    }

    var fadeInParams = JSON.parse(JSON.stringify(paramList[0]));
    fadeInParams.onFinished = cycleNextCallback;
    fadeInParams.duration = fadeIn;

    _.each(paramList, function(params) {
      params.onFinished = cycleNextCallback;
    });

    modifyHighlight($space, fadeInParams, override);
  };

  function clearHighlight($space, fadeOut, override) {
    modifyHighlight($space, {strokeOpacity:0, fillOpacity:0, duration:fadeOut}, override);
    $space.removeAttr('href');
    $space.attr('nohref', 'nohref');
    $space.off('click');
  }

  function highlightSpace($space) {
    flashHighlight($space,
      [{strokeColor:"00C8FF", fillColor:"00C8FF", duration:500, strokeWidth:5},
      {strokeColor:'FFFFFF', fillColor:"00C8FF", duration:500, strokeWidth:5}], 200, true);
  };

  function markMoveable($space) {
    flashHighlight($space,
      [{strokeColor:darkGreen, fillColor:'FFFFFF', fillOpacity:0.2, duration:500, strokeWidth:5},
      {strokeColor:medGreen, fillColor:'FFFFFF', fillOpacity:0.2, duration:500, strokeWidth:5}], 200);
  }

  function markSelectable($space) {
    if (!isPlayback) {
      flashHighlight($space,
        [{strokeColor:darkGreen, fillColor:'FFFFFF', fillOpacity:0.2, duration:500, strokeWidth:5},
        {strokeColor:medGreen, fillColor:'FFFFFF', fillOpacity:0.2, duration:500, strokeWidth:5}], 200);
    }
  };

  function markSelected($space) {
    if (!isPlayback) {
      flashHighlight($space,
        [{strokeColor:lightGreen, fillColor:'FFFFFF', fillOpacity:0.5, duration:500, strokeWidth:5}], 500);
      $('#selection_map').append($space);
    }
  };

  function markVisible($space) {
    flashHighlight($space,
     [{fillColor:'ffff00', strokeOpacity:0, fillOpacity:0.32, strokeWidth:0}], 200);
    $('#selection_map').append($space);
  }

  function markVisibleAndHighlight($space) {
    flashHighlight($space,
      [{strokeColor:'1F4C0F', fillColor:'FFFF00', duration:500},
      {strokeColor:'52CC29', fillColor:'FFFF00', duration:500}], 200);
    $('#selection_map').append($space);
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
    var showNotification;
    var role, board, currentPhase, currentTurn, remainingMovementPoints, visibleInsurgents, revealedInsurgents;

    var clearSelectionHandler = function(e) {
      if (!role || !board) {
        throw "Trying to clear selection, but no game data received yet.";
      }
      render();
      showNotification("");
    };

    var clearListeners = function() {
      var $allSpaces = $(".space");
      $allSpaces.off('click');
      $allSpaces.each(function() {
        var $space = $(this);
        var data = $space.data('maphilight') || {};
        delete data.clickHandler;
      });
    };

    var clearGhosts = function() {
      var $markers = $("[id^=marker] .ghost");
      $markers.remove();
    }

    var clearSelected = function() {
      //Remove hilight from all maphilights
      $spaces = $(".space");
      $spaces.each(function(index, space) {
        var $space = $(space);
        clearHighlight($space, 200);
      });
    };

    var clearOverride = function() {
      $spaces = $(".space");
      $spaces.each(function(index, space) {
        var $space = $(space);
        data = $space.data('maphilight') || {};
        if (data.hasOwnProperty('override')) {
          // If there was a highlight effect before the override, ensure
          // that we restore the previous highlight and click handler.
          if (data.override.wasOn) {
            data.override.wasOn = false;
            modifyHighlight($space, data.override, true);
            $space.removeAttr('nohref');
            $space.attr('href', '#');
            if (data.clickHandler) {
              $space.on('click', data.clickHandler);
            }
          } else {
            clearHighlight($space, 500, true);
          }

          delete data.override;
          $space.data('maphilight', data);
        }
      });
    };

    var setupOverride = function() {
      clearOverride();
      $spaces = $(".space");
      $spaces.each(function(index, space) {
        var $space = $(space);
        data = $space.data('maphilight') || {};
        if (data.alwaysOn) {
          var override = {};
          override.wasOn = data.alwaysOn;
          override.onFinished = data.end.onFinished;
          override.strokeColor = data.end.strokeColor;
          override.fillColor = data.end.fillColor;
          override.strokeOpacity = data.end.strokeOpacity;
          override.fillOpacity = data.end.fillOpacity;
          override.strokeWidth = data.end.strokeWidth;
          override.duration = 500;
          data.override = override;

          clearHighlight($space, 200, true);
        }
      });
    };

    var displayInsurgentPlacements = function() {

      var positions = [];
      _.times(C.NUM_RANKS, function(i) {
        positions.push(Position(0)(i));
      });

      _.each(positions, function(position) {
        var $space = $findSpace(position);
        markSelectable($space);
        spaceHandler($space, function(e) {
          clearSelected();
          clearListeners();
          e.stopPropagation();
          controller.placeInsurgent(position.circle, position.rank);
        });
      });
    };

    var displayMovablePieces = function(Move, board, role, currentTurn, remainingMovementPoints, controllerMethod, adjacentSrcFilterMaker) {
      var positions = board.getPositionsByType(currentTurn);

      if (!adjacentSrcFilterMaker) {
        adjacentSrcFilterMaker = function(src) { return function(dest) { return true }; };
      }

      _.each(positions, function(src) {
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

        var $space = $findSpace(src);
        // Ignore pieces that can't move.
        if (adjacentPositions.length === 0) {
          return;
        } else if ((role === C.INSURGENT || isPlayback) && board.getInsurgentPiecesAt(src).length > 1 ||
          board.getInsurgentPiecesAt(src).length > 0 && board.getStatePiecesAt(src).length > 0) {
          markVisibleAndHighlight($space);
        } else {
          markSelectable($space);
        }
        spaceHandler($space, function(e) {
          e.stopPropagation();
          clearSelected();
          clearListeners();
          markSelected($space);
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
            markMoveable($destSpace);
            spaceHandler($destSpace, function(e) {
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
        markSelectable($space);
        spaceHandler($space, function(e) {
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
    var init = function($container, _controller, $_wrapper, _showNotification) {
      $board = $container;
      $wrapper = $_wrapper;
      controller = _controller;
      showNotification = _showNotification;
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
        fade: true,
        fill: false,
        stroke: false,
        alwaysOn: false,
        fillOpacity: 0.55,
        strokeWidth: 5,
        wrapClass: 'board_position'
      });

      $wrapper.on('click', clearSelectionHandler);

      setupHighlightTransitions();
    };

    var render = function() {
      clearSelected(); // This clears all visibility markers too
      clearListeners();
      clearGhosts();
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

        var visible = false;
        if ((role === C.INSURGENT || isPlayback) && groups[C.INSURGENT] && groups[C.INSURGENT].length > 1) {
          visible = true;
        }

        if (visibleInsurgents.indexOf(poskey) !== -1) {
          visible = true;
        }

        _.each(groups[C.INSURGENT], function(piece) {
          var $piece = ich.piece({type: C.INSURGENT});
          if (visible) {
            $piece.addClass('visible');
            $piece.addClass('selected');
          }
          $marker.append($piece);
        });

        if (visible) {
          var $space = $findSpace(position);
          markVisible($space);
        }
      });

      if (!isPlayback) {
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
      }

      _.each(revealedInsurgents, function(revealed) {
        var position = Position(revealed.pos);
        revealInsurgents([position], 1.0 - (revealed.time / C.INTERROGATE_REVEAL_DURATION), true);
      });
    };

    var revealInsurgents = function(positions, alpha, highlight) {
      _.chain(positions)
        .map(function(position) { return position.asKey(); }) // Convert to poskeys so we can run uniq() successfully
        .uniq()
        .map(function(poskey) { return Position(poskey); })
        .each(function(position) {
          if (highlight) {
            var $marker = $("#marker"+position.circle+"-"+position.rank + " .pieces").first();
            $marker.children().each(function() {
              $(this).addClass('visible');
              $(this).addClass('selected');
            });
            // var $space = $findSpace(position);
            // markVisible($space);
          }
          var $marker = $("#marker"+position.circle+"-"+position.rank + " .pieces").first();
          if ($marker.children().length === 0) {
            var $content = $("#marker"+position.circle+"-"+position.rank + " .content").first();
            clearGhost(position);
            var $ghost = ich.ghost();
            if (typeof alpha === 'number') {
              $ghost.css('opacity', alpha);
            }
            $content.append($ghost);
          }
        });
    };

    return {
      init: init,
      render: function(_role, _board, _currentPhase, _currentTurn, _remainingMovementPoints, _visibleInsurgents, _revealedInsurgents, _isPlayback) {
        role = _role;
        board = _board;
        currentPhase = _currentPhase;
        currentTurn = _currentTurn;
        remainingMovementPoints = _remainingMovementPoints;
        visibleInsurgents = _visibleInsurgents;
        revealedInsurgents = _revealedInsurgents;
        isPlayback = _isPlayback;
        render();
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
          .reject(function(position) {
            return position.circle === 4;
          })
          .value();
        showCandidates(positions, function(position) {
          controller.grow(position);
        });
      },
      highlightPosition: function(position) {
        setupOverride();

        var $space = $findSpace(position);
        highlightSpace($space);
      },
      clearHighlightedPosition: function() {
        clearOverride();
      },
    };
  };

  return BoardView;
});
