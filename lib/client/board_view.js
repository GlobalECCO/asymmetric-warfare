define(['underscore', 'allong.es', 'lib/constants', 'lib/position', 'lib/insurgent_move', 'lib/state_move'],
    function(_, allong, C, Position, InsurgentMove, StateMove) {

  var isPlayback = false;

  var darkGreen = '1F4C0F'; //31,76,15
  var medGreen = '52CC29'; //82,204,41
  var lightGreen = 'C2FFAD'; //194,255,173

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

  function modifyHighlight($space, params) {
    var data = $space.data('maphilight') || {};
    if (data.hasOwnProperty('override')) {
      data.strokeColorOR = params.strokeColor;
      data.fillColorOR = params.fillColor;
    } else {
      data.alwaysOn = true;
      params.fill && (data.fill = params.fill);
      data.stroke = true;
      data.strokeColor = params.strokeColor;
      data.fillColor = params.fillColor;
      params.fillOpacity && (data.fillOpacity = params.fillOpacity);
    }
    $space.data('maphilight', data).trigger('alwaysOn.maphilight');
  };

  function modifyOverrideHighlight($space, strokeColour, fillColour) {
    var data = $space.data('maphilight') || {};
    if (!data.hasOwnProperty('override')) {
      data.override = true;
      data.strokeColorOR = data.strokeColor;
      data.fillColorOR = data.fillColor;
      data.alwaysOnOR = data.alwaysOn;
    }
    data.alwaysOn = true;
    data.fill = true;
    data.stroke = true;
    data.strokeColor = strokeColour;
    data.fillColor = fillColour;
    $space.data('maphilight', data).trigger('alwaysOn.maphilight');
  };

  function decToHex(dec) {
    var hex = dec.toString(16);
    return hex.length === 1? "0" + hex: hex;
  };

  function rgb(red, green, blue) {
    var result = decToHex(red) + decToHex(green) + decToHex(blue);
    return result;
  };

  function hex_to_decimal(hex) {
		return Math.max(0, Math.min(parseInt(hex, 16), 255));
	};

  function css3color(color) {
		return [hex_to_decimal(color.substr(0,2)),
            hex_to_decimal(color.substr(2,2)),
            hex_to_decimal(color.substr(4,2))];
  };

  function rgbMix(fromColor, toColor, alpha) {
    var result = [];
    for (var colorIndex = 0; colorIndex < 3; ++colorIndex) {
      var color = fromColor[colorIndex] * (1 - alpha) + toColor[colorIndex] * alpha;
      result[colorIndex] = Math.floor(color);
    }
    return rgb(result[0], result[1], result[2]);
  };

  function flash($space, param, speed, override) {
    var data = $space.data('highlightAnim') || {};
    var id = 'id';
    if (override) {
      id = 'idOR';
    }
    if (data[id] > 0) {
      clearInterval(data);
    }

    var delta = 0;
    var phase = 1;
    data[id] = setInterval(function() {
      delta += speed * phase;
      if (delta > 100) {
        delta = 100;
        phase = -1;
      } else if (delta < 0) {
        delta = 0;
        phase = 1;
      }

      var alpha = delta * 0.01;
      if (override) {
        //TODO
        //modifyOverrideHighlight($space, strokeColor, rgbMix(strokeFromColor, strokeToColor, alpha));
      } else {
        var sc = _.isArray(param.strokeColor) ? rgbMix(param.strokeColor[0], param.strokeColor[1], alpha) : param.strokeColor;
        var fc = _.isArray(param.fillColor) ? rgbMix(param.fillColor[0], param.fillColor[1], alpha) : param.fillColor;
        modifyHighlight($space, {strokeColor:sc, fillColor:fc});
      }
    }, 100);
    $space.data('highlightAnim', data);
  };

  function overrideHighlightSpace($space) {
    modifyOverrideHighlight($space, "00C8FF", "00C8FF");
    flash($space, "00C8FF", [0, 200, 255], [255, 255, 255], 20, true);
  };

  function markMoveable($space) {
    flash($space, {fillColor:medGreen, strokeColor:[[31,76,15], [82,204,41]]}, 20);
  }

  function highlightSpace($space) {
    if (!isPlayback) {
      flash($space, {fillColor:medGreen, strokeColor:[[31,76,15], [82,204,41]]}, 20);
    }
  };

  function markSelected($space) {
    if (!isPlayback) {
      modifyHighlight($space, {strokeColor:medGreen, fillColor:darkGreen, fill:true});
      $('#selection_map').append($space);
    }
  };

  function markVisible($space) {
    modifyHighlight($space, {fill:true});
    flash($space, {fillColor:'ff3333', strokeColor:[[31,76,15], [82,204,41]]}, 20);
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
    var role, board, currentPhase, currentTurn, remainingMovementPoints, revealedInsurgents;

    var clearSelectionHandler = function(e) {
      if (!role || !board) {
        throw "Trying to clear selection, but no game data received yet.";
      }
      clearSelected();
      render(role, board, currentPhase, currentTurn, remainingMovementPoints, visibleInsurgents, revealedInsurgents);
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
        var data = $space.data('highlightAnim');
        if (data) {
          if (data.id > 0) {
            clearInterval(data.id);
          }
          if (data.idOR > 0) {
            clearInterval(data.idOR);
          }
          $space.data('highlightAnim', {});
        }
        
        data = $space.data('maphilight') || {};
        data.alwaysOn = false;
        data.fill = false;
        data.stroke = false;
        $space.data('maphilight', data).trigger('alwaysOn.maphilight');
        $space.removeAttr('href');
        $space.attr('nohref', 'nohref');
        $space.off('click');
      });
    };

    var setupOverride = function() {
      $spaces = $(".space");
      $spaces.each(function(index, space) {
        var $space = $(space);
        var data = $space.data('highlightAnim');
        if (data && data.idOR) {
          clearInterval(data.idOR);
          data.idOR = 0;
          $space.data('highlightAnim', data);
        }
        data = $space.data('maphilight') || {};
        if (data.alwaysOn) {
          data.override = true;
          data.alwaysOnOR = true;
          data.strokeColorOR = data.strokeColor;
          data.fillColorOR = data.fillColor;
        }
        data.alwaysOn = false;
        data.fill = false;
        data.stroke = false;
        $space.data('maphilight', data).trigger('alwaysOn.maphilight');
        $space.removeAttr('href');
        $space.attr('nohref', 'nohref');
        $space.off('click');
      });
    };

    var clearOverride = function() {
      $spaces = $(".space");
      $spaces.each(function(index, space) {
        var $space = $(space);
        var data = $space.data('highlightAnim');
        if (data && data.idOR) {
          clearInterval(data.idOR);
          data.idOR = 0;
          $space.data('highlightAnim', data);
        }
        data = $space.data('maphilight') || {};
        if (data.hasOwnProperty('override') && data.override) {
          delete data.override;
          data.strokeColor = data.strokeColorOR;
          data.fillColor = data.fillColorOR;
          delete data.strokeColorOR;
          delete data.fillColorOR;
          data.alwaysOn = data.alwaysOnOR;
          data.fill = data.alwaysOnOR;
          data.stroke = data.alwaysOnOR;
          delete data.alwaysOnOR;
          $space.data('maphilight', data).trigger('alwaysOn.maphilight');

          if (data.alwaysOn) {
            $space.removeAttr('nohref');
            $space.attr('href', '#');
            if (data.clickHandler) {
              $space.on('click', data.clickHandler);
            }
          } else {
            $space.removeAttr('href');
            $space.attr('nohref', 'nohref');
            $space.off('click');
          }
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
        highlightSpace($space);
        spaceHandler($space, function(e) {
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
        // } else if ((role === C.INSURGENT || isPlayback) && board.getInsurgentPiecesAt(src).length > 1) {
        //   markVisible($space);
        } else {
          highlightSpace($space);
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
        highlightSpace($space);
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
        fillOpacity: 0.75,
        strokeWidth: 5,
        wrapClass: 'board_position'
      });

      $wrapper.on('click', clearSelectionHandler);
    };

    var render = function(role, board, currentPhase, currentTurn, remainingMovementPoints, visibleInsurgents, revealedInsurgents) {
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

        // if ((role === C.INSURGENT || isPlayback) && groups[C.INSURGENT] && groups[C.INSURGENT].length > 1) {
        //   // This space is visible to the State player. Mark it as such.
        //   markVisible($findSpace(position));
        // }
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

      // _.each(visibleInsurgents, function(visible) {
      //   var position = Position(visible);
      //   $space = $findSpace(position);
      //   markVisible($space);
      // });

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
        render(role, board, currentPhase, currentTurn, remainingMovementPoints, visibleInsurgents, revealedInsurgents);
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
        this.clearHighlightedPosition();
        var $space = $findSpace(position);
        setupOverride();
        overrideHighlightSpace($space);
      },
      clearHighlightedPosition: function() {
        clearOverride();
      },
    };
  };

  return BoardView;
});
