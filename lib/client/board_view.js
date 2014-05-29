define(['underscore', 'allong.es', 'lib/constants', 'lib/position', 'lib/insurgent_move', 'lib/state_move'],
function(_, allong, C, Position, InsurgentMove, StateMove) {

  var isPlayback = false;

  var darkGreen = '1F4C0F';
  var medGreen = '52CC29';
  var lightGreen = 'C2FFAD';

  function decToHex(dec) {
    var hex = dec.toString(16);
    return hex.length === 1? "0" + hex: hex;
  }

  function hexToDec(hex) {
    return Math.max(0, Math.min(parseInt(hex, 16), 255));
  }

  function colorDecToHex(red, green, blue) {
    var result = decToHex(red) + decToHex(green) + decToHex(blue);
    return result;
  }

  function colorHexToDec(color) {
    if (typeof color === 'string' && color.length === 6) {
      return [hexToDec(color.substr(0,2)),
              hexToDec(color.substr(2,2)),
              hexToDec(color.substr(4,2))];
    } else {
      return undefined;
    }
  }

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
  }

  function $findSpace(position) {
    return $("#space" + position.circle + "-" + position.rank).first();
  }

  function clearGhost(position) {
    $("#marker" + position.circle + "-" + position.rank + " .ghost").remove();
  }

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
      $spaces = $("#table_area .space"); // Make sure to not grab tutorial .spaces
      $spaces.each(function(index, space) {
        $space = $(space);
        var data = $space.data('maphilight') || {};

        if (data.alwaysOn) {
          var strokeFinished = false;
          var fillFinished = false;

          if (data.strokeStart && data.strokeEnd) {
            var alpha = data.strokeStart.elapsed / data.strokeEnd.fade;
            data.strokeStart.elapsed += intervalTime;

            strokeFinished = data.strokeStart.elapsed >= data.strokeEnd.fade;

            // Lerp all values
            if (!strokeFinished) {
              data.strokeColor = colorLerp(data.strokeStart.color, data.strokeEnd.color, alpha);
              data.strokeWidth = lerp(data.strokeStart.width, data.strokeEnd.width, alpha);
              data.strokeOpacity = lerp(data.strokeStart.opacity, data.strokeEnd.opacity, alpha);
            } else {
              data.strokeColor = data.strokeEnd.color;
              data.strokeWidth = data.strokeEnd.width;
              data.strokeOpacity = data.strokeEnd.opacity;
            }

            data.stroke = data.strokeColor && data.strokeOpacity? true: false;
          }

          if (data.fillStart && data.fillEnd) {
            var alpha = data.fillStart.elapsed / data.fillEnd.fade;
            data.fillStart.elapsed += intervalTime;

            fillFinished = data.fillStart.elapsed >= data.fillEnd.fade;

            // Lerp all values
            if (!fillFinished) {
              data.fillColor = colorLerp(data.fillStart.color, data.fillEnd.color, alpha);
              data.fillOpacity = lerp(data.fillStart.opacity, data.fillEnd.opacity, alpha);
            } else {
              data.fillColor = data.fillEnd.color;
              data.fillOpacity = data.fillEnd.opacity;
            }

            data.fill = data.fillColor && data.fillOpacity? true: false;
          }

          $space.data('maphilight', data).trigger('alwaysOn.maphilight');

          if (strokeFinished) {
            var onFinished = data.strokeEnd.onFinished;
            if (!data.stroke && !data.fill) {
              data.alwaysOn = false;
              delete data.strokeStart;
              delete data.strokeEnd;
            }

            if (typeof onFinished === 'function') {
              onFinished();
            }
          }
          if (fillFinished) {
            var onFinished = data.fillEnd.onFinished;
            if (!data.stroke && !data.fill) {
              data.alwaysOn = false;
              delete data.fillStart;
              delete data.fillEnd;
            }

            if (typeof onFinished === 'function') {
              onFinished();
            }
          }
        }
      });
    }, intervalTime);
  }

  function modifyHighlight($space, params, override) {
    var data = $space.data('maphilight') || {};
    var strokeStart;
    var fillStart;
    var strokeEnd;
    var fillEnd;

    if (params.hasOwnProperty('strokeColor') || params.hasOwnProperty('strokeWidth') || params.hasOwnProperty('strokeOpacity') || params.hasOwnProperty('onStrokeFinished')) {
      strokeStart = {
        color: data.strokeColor || params.strokeColor,
        width: data.hasOwnProperty('strokeWidth')? data.strokeWidth: params.hasOwnProperty('strokeWidth')? params.strokeWidth: 5,
        opacity: data.hasOwnProperty('strokeOpacity')? data.strokeOpacity: 0,
        elapsed: 0,
      };
      strokeEnd = {
        onFinished: params.hasOwnProperty('onStrokeFinished')? params.onStrokeFinished: (data.strokeEnd && data.strokeEnd.hasOwnProperty('onFinished'))? data.strokeEnd.onFinished: undefined,
        color: params.strokeColor || (data.strokeEnd && data.strokeEnd.color) || strokeStart.color,
        width: params.hasOwnProperty('strokeWidth')? params.strokeWidth: (data.strokeEnd && data.strokeEnd.width) || strokeStart.width,
        opacity: params.hasOwnProperty('strokeOpacity')? params.strokeOpacity: (data.strokeEnd && data.strokeEnd.hasOwnProperty('opacity'))? data.strokeEnd.opacity: strokeStart.opacity,
        fade: params.hasOwnProperty('strokeFade')? params.strokeFade: (data.strokeEnd && data.strokeEnd.hasOwnProperty('fade'))? data.strokeEnd.fade: 1,
      };

      if (!data.hasOwnProperty('strokeColor')) {
        data.strokeColor = strokeStart.color;
      }
      if (!data.hasOwnProperty('strokeWidth')) {
        data.strokeWidth = strokeStart.width;
      }
      if (!data.hasOwnProperty('strokeOpacity')) {
        data.strokeOpacity = strokeStart.opacity;
      }
    }

    if (params.hasOwnProperty('fillColor') || params.hasOwnProperty('fillOpacity') || params.hasOwnProperty('onFillFinished')) {
      fillStart = {
        color: data.fillColor || params.fillColor,
        opacity: data.hasOwnProperty('fillOpacity')? data.fillOpacity: 0,
        elapsed: 0,
      };
      fillEnd = {
        onFinished: params.hasOwnProperty('onFillFinished')? params.onFillFinished: (data.fillEnd && data.fillEnd.hasOwnProperty('onFinished'))? data.fillEnd.onFinished: undefined,
        color: params.fillColor || (data.fillEnd && data.fillEnd.color) || fillStart.color,
        opacity: params.hasOwnProperty('fillOpacity')? params.fillOpacity: (data.fillEnd && data.fillEnd.hasOwnProperty('opacity'))? data.fillEnd.opacity: fillStart.opacity,
        fade: params.hasOwnProperty('fillFade')? params.fillFade: (data.fillEnd && data.fillEnd.hasOwnProperty('fade'))? data.fillEnd.fade: 1,
      };

      if (!data.hasOwnProperty('fillColor')) {
        data.fillColor = fillStart.color;
      }
      if (!data.hasOwnProperty('fillOpacity')) {
        data.fillOpacity = fillStart.opacity;
      }
    }

    if (!override && data.hasOwnProperty('override')) {
      data.override.strokeEnd = strokeEnd;
      data.override.fillEnd = fillEnd;
    } else {
      data.alwaysOn = false;
      if (strokeStart && strokeEnd) {
        data.strokeStart = strokeStart;
        data.strokeEnd = strokeEnd;
      }
      if (fillStart && fillEnd) {
        data.fillStart = fillStart;
        data.fillEnd = fillEnd;
      }

      if (data.strokeStart && data.strokeStart.opacity > 0) {
        data.alwaysOn = true;
      }
      if (data.strokeEnd && data.strokeEnd.opacity > 0) {
        data.alwaysOn = true;
      }
      if (data.fillStart && data.fillStart.opacity > 0) {
        data.alwaysOn = true;
      }
      if (data.fillEnd && data.fillEnd.opacity > 0) {
        data.alwaysOn = true;
      }

      if (override && !data.hasOwnProperty('override')) {
        data.override = {};
        data.override.wasOn = false;
      }
    }
    $space.data('maphilight', data);
  }

  function flashHighlight($space, paramsList, fadeIn, override) {
    var currentStrokeIndex = 0;
    var currentFillIndex = 0;

    var hasStroke = false;
    var hasFill = false;

    var strokeParamsList = [];
    var fillParamsList = [];

    var cycleNextStrokeCallback = function() {
      currentStrokeIndex++;
      if (currentStrokeIndex >= strokeParamsList.length) {
        currentStrokeIndex = 0;
      }
      modifyHighlight($space, strokeParamsList[currentStrokeIndex], override);
    }

    var cycleNextFillCallback = function() {
      currentFillIndex++;
      if (currentFillIndex >= fillParamsList.length) {
        currentFillIndex = 0;
      }
      modifyHighlight($space, fillParamsList[currentFillIndex], override);
    }

    _.each(paramsList, function(params) {
      var strokeParams = {};
      var fillParams = {};

      if (params.hasOwnProperty('strokeColor')) {
        strokeParams.strokeColor = params.strokeColor;
        hasStroke = true;
      }
      if (params.hasOwnProperty('strokeWidth')) {
        strokeParams.strokeWidth = params.strokeWidth;
        hasStroke = true;
      }
      if (params.hasOwnProperty('strokeOpacity')) {
        strokeParams.strokeOpacity = params.strokeOpacity;
        hasStroke = true;
      }
      if (params.hasOwnProperty('strokeFade')) {
        strokeParams.strokeFade = params.strokeFade;
        hasStroke = true;
      }
      strokeParams.onStrokeFinished = cycleNextStrokeCallback;

      if (params.hasOwnProperty('fillColor')) {
        fillParams.fillColor = params.fillColor;
        hasFill = true;
      }
      if (params.hasOwnProperty('fillOpacity')) {
        fillParams.fillOpacity = params.fillOpacity;
        hasFill = true;
      }
      if (params.hasOwnProperty('fillFade')) {
        fillParams.fillFade = params.fillFade;
        hasFill = true;
      }
      fillParams.onFillFinished = cycleNextFillCallback;

      strokeParamsList.push(strokeParams);
      fillParamsList.push(fillParams);
    });

    if (hasStroke) {
      var fadeInStrokeParams = JSON.parse(JSON.stringify(strokeParamsList[0]));
      fadeInStrokeParams.onStrokeFinished = cycleNextStrokeCallback;
      fadeInStrokeParams.strokeFade = fadeIn;
      modifyHighlight($space, fadeInStrokeParams, override);
    }
    if (hasFill) {
      var fadeInFillParams = JSON.parse(JSON.stringify(fillParamsList[0]));
      fadeInFillParams.onFillFinished = cycleNextFillCallback;
      fadeInFillParams.fillFade = fadeIn;
      modifyHighlight($space, fadeInFillParams, override);
    }
  }

  function clearHighlight($space, fadeOut, override) {
    modifyHighlight($space, {strokeOpacity:0, fillOpacity:0, strokeFade:fadeOut, fillFade:fadeOut, onStrokeFinished:1, onFillFinished:1}, override);
    $space.removeAttr('href');
    $space.attr('nohref', 'nohref');
    $space.off('click');
  }

  function highlightSpace($space) {
    flashHighlight($space,
      [{strokeColor:"00C8FF", strokeWidth:5, strokeOpacity:1, strokeFade:500, fillColor:"00C8FF", fillOpacity:0.4, fillFade:500},
      {strokeColor:'FFFFFF', strokeWidth:5, strokeOpacity:1, strokeFade:500, fillColor:"00C8FF", fillOpacity:0.4, fillFade:500}], 200, true);
  }

  function markSafe($space) {
    modifyHighlight($space, {fillColor:'FFFFFF', fillOpacity:0.3, fillFade:200});
  }

  function markSuspected($space) {
    modifyHighlight($space, {fillColor:'FF0000', fillOpacity:0.2, fillFade:200});
  }

  function markVisible($space) {
    flashHighlight($space,
      [{fillColor:'FF0000', fillOpacity:0.1, fillFade:500},
      {fillColor:'FF0000', fillOpacity:0.5, fillFade:500}], 200);
  }

  function markPlaceable($space) {
    markSelectable($space);

    // Special case, only fill in the position if it is not filled already.
    var data = $space.data('maphilight') || {};
    if ((!data.fillStart && !data.fillEnd) || data.fillEnd.opacity <= 0) {
      flashHighlight($space,
        [{fillColor:"FFFFFF", fillOpacity:0.2, fillFade:500},
        {fillColor:"FFFFFF", fillOpacity:0.2, fillFade:500}], 200);
    }
  }

  function markMoveable($space) {
    flashHighlight($space,
      [{strokeColor:darkGreen, strokeWidth:5, strokeOpacity:1, fillColor:"FFFFFF", fillOpacity:0.3, strokeFade:500, fillFade:500},
      {strokeColor:medGreen, strokeWidth:5, strokeOpacity:1, fillColor:"FFFFFF", fillOpacity:0.3, strokeFade:500, fillFade:500}], 200);
  }

  function markSelectable($space) {
    if (!isPlayback) {
      flashHighlight($space,
        [{strokeColor:darkGreen, strokeWidth:5, strokeOpacity:1, strokeFade:500},
        {strokeColor:medGreen, strokeWidth:5, strokeOpacity:1, strokeFade:500}], 200);
    }
  }

  function markSelected($space) {
    if (!isPlayback) {
      flashHighlight($space,
        [{strokeColor:lightGreen, strokeWidth:5, strokeOpacity:1, fillColor:'FFFFFF', fillOpacity:0.5, strokeFade:500, fillFade:500},
        // {strokeColor:lightGreen, strokeWidth:5, strokeOpacity:1, fillColor:'FFFFFF', fillOpacity:0.5, strokeFade:1000, fillFade:1000},
        // {strokeColor:lightGreen, strokeWidth:5, strokeOpacity:0.5, fillColor:'FFFFFF', fillOpacity:0.5, strokeFade:10, fillFade:10},
        // {strokeColor:lightGreen, strokeWidth:5, strokeOpacity:0.5, fillColor:'FFFFFF', fillOpacity:0.5, strokeFade:10, fillFade:10},
        // {strokeColor:lightGreen, strokeWidth:5, strokeOpacity:0.5, fillColor:'FFFFFF', fillOpacity:0.5, strokeFade:10, fillFade:10}
        ], 500);
      $('#selection_map').append($space);
    }
  }

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
          if (data.strokeEnd) {
            override.onStrokeFinished = data.strokeEnd.onFinished;
            override.strokeColor = data.strokeEnd.color;
            override.strokeWidth = data.strokeEnd.width;
            override.strokeOpacity = data.strokeEnd.opacity;
            override.strokeFade = 500;
          }
          if (data.fillEnd) {
            override.onFillFinished = data.fillEnd.onFinished;
            override.fillColor = data.fillEnd.color;
            override.fillOpacity = data.fillEnd.opacity;
            override.fillFade = 500;
          }
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
        markPlaceable($space);
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
        // } else if ((role === C.INSURGENT || isPlayback) && board.getInsurgentPiecesAt(src).length > 1 ||
        //   board.getInsurgentPiecesAt(src).length > 0 && board.getStatePiecesAt(src).length > 0) {
        //   markVisible($space);
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
        markMoveable($space);
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

        var $space = $findSpace(position);

        if (!isPlayback) {
          if (groups[role] && groups[role].length > 0) {
            markSafe($space);
          }
        }

        if (_.find(revealedInsurgents, function(pos) {
          return pos.pos == poskey;
        })) {
          markSuspected($space);
        }

        if ((role === C.INSURGENT || isPlayback) && groups[C.INSURGENT] && groups[C.INSURGENT].length > 1) {
          markVisible($space);
        }

        if (visibleInsurgents.indexOf(poskey) !== -1) {
          markVisible($space);
        }

        _.each(groups[C.INSURGENT], function(piece) {
          var $piece = ich.piece({type: C.INSURGENT});
          // if (suspected) {
          //   $piece.addClass('visible');
          //   $piece.addClass('selected');
          // }
          $marker.append($piece);
        });
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

      if (role === C.STATE && !isPlayback) {
        _.each(revealedInsurgents, function(revealed) {
          var position = Position(revealed.pos);
          revealInsurgents([position], 1.0 - (revealed.time / C.INTERROGATE_REVEAL_DURATION), true);
        });
      }
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
              // $(this).addClass('visible');
              // $(this).addClass('selected');
            });
            // var $space = $findSpace(position);
            // markSuspected($space);
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
