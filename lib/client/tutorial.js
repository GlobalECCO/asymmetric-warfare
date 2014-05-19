define(['underscore', 'lib/helpers', 'lib/asymmetric_warfare'], function(_, h, AsymmetricWarfare) {

  function Tutorial() {
    var self = this;
    self.active = false;
    self.finished = false;
    self.script = [];
    self.timers = [];
    self.step = 0;
    self.socket = null;
    self.role = null;
    self.background = null;
    self.foreground = null;
    self.buttonContainer = null;
    self.gameState = null;
    self.initialGameState = null;

    //----------------------------------------------------------------------------
    Tutorial.prototype.initTutorialSteps = function() {
      if (self.isStatePlayer()) {
        self.initStateTutorialSteps();
      }
      else {
        self.initInsurgentTutorialSteps();
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initStateTutorialSteps = function() {
      self.placeInsurgentPieces();

      self.script = [
        // Step 1
        [{
          el: '.endTutorialButton:first',
          tip: {
            content: 'Click here to start playing the game.',
            tipJoint: 'bottom'
          },
          delay: self.clickDelay,
        }],
      ];
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.placeInsurgentPieces = function() {
      self.placePiece(self.gameState.addInsurgent, '0,0');
      self.placePiece(self.gameState.addInsurgent, '0,0');
      self.placePiece(self.gameState.addInsurgent, '0,3');
      self.placePiece(self.gameState.addInsurgent, '0,6');
      self.placePiece(self.gameState.addInsurgent, '0,9');
      self.updatePlayer();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initInsurgentTutorialSteps = function() {
      self.script = [
        // Step 1
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [5, -520],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [5, -520],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [-515, 5],
            tipJoint: 'left',
          },
          action: '#space0-9',
          highlightBounds: {left: 334, top: 253, width: 79, height: 155},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [520, 5],
            tipJoint: 'right',
          },
          action: '#space0-3',
          highlightBounds: {left: 853, top: 253, width: 79, height: 155},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [5, 530],
            tipJoint: 'bottom',
          },
          action: '#space0-6',
          highlightBounds: {left: 555, top: 553, width: 155, height: 76},
          callback: self.moveStateTurnOne,
        }],

        [{
          el: '#grow',
          tip: {
            content: 'Test',
            tipJoint: 'right',
          },
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [65, -438],
            tipJoint: 'top',
          },
          action: '#space1-0',
          highlightBounds: {left: 630, top: 97, width: 120, height: 92},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [5, -520],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [-50, -438],
            tipJoint: 'top',
          },
          action: '#space1-11',
          highlightBounds: {left: 515, top: 97, width: 120, height: 92},
          callback: self.moveStateTurnTwo,
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [-50, -438],
            tipJoint: 'top',
          },
          action: '#space1-11',
          highlightBounds: {left: 515, top: 97, width: 120, height: 92},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [65, -438],
            tipJoint: 'top',
          },
          action: '#space1-0',
          highlightBounds: {left: 630, top: 97, width: 120, height: 92},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [5, -520],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [140, -460],
            tipJoint: 'top',
          },
          action: '#space0-1',
          highlightBounds: {left: 690, top: 43, width: 155, height: 126},
        }],

        [{
          el: '#end_turn',
          tip: {
            content: 'Test',
            tipJoint: 'right',
          },
          callback: self.moveStateTurnThree,
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [65, -438],
            tipJoint: 'top',
          },
          action: '#space1-0',
          highlightBounds: {left: 630, top: 97, width: 120, height: 92},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [-50, -438],
            tipJoint: 'top',
          },
          action: '#space1-11',
          highlightBounds: {left: 515, top: 97, width: 120, height: 92},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [-50, -438],
            tipJoint: 'top',
          },
          action: '#space1-11',
          highlightBounds: {left: 515, top: 97, width: 120, height: 92},
        }],

        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Test',
            offset: [-135, -374],
            tipJoint: 'top',
          },
          action: '#space1-10',
          highlightBounds: {left: 430, top: 130, width: 120, height: 120},
          callback: self.moveStateTurnFour,
        }],

        [{
          el: '.endTutorialButton:first',
          tip: {
            content: 'Click here to start playing the game.',
            tipJoint: 'bottom'
          },
          delay: self.clickDelay,
        }],
      ];
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveStateTurnOne = function() {
      setTimeout(function() {
        self.movePiece(self.gameState.stateMove, '4,0', '3,0');
        self.gameState.endTurn();
        self.updatePlayer();
      }, 0);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveStateTurnTwo = function() {
      self.movePiece(self.gameState.stateMove, '3,0', '2,0');
      self.gameState.endTurn();
      self.updatePlayer();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveStateTurnThree = function() {
      setTimeout(function() {
        self.movePiece(self.gameState.stateMove, '2,0', '1,0');
        self.gameState.interrogate(h.Position('1,0'));
        self.updatePlayer();
      }, 0);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveStateTurnFour = function() {
      setTimeout(function() {
        self.gameState.kill(h.Position('1,0'));
        self.movePiece(self.gameState.stateMove, '1,0', '0,1');
        self.updatePlayer();
      }, 0);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.placePiece = function(placeFunction, position) {
      placeFunction(h.Position(position));
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.movePiece = function(moveFunction, source, destination) {
      moveFunction(h.Position(source), h.Position(destination));
    };

    //----------------------------------------------------------------------------
    // Defined 'fake' server handlers for taking turns.
    self.serverHandlers = [
      {
        signal: 'placeInsurgent',
        handler: function(poskey) {
          return self.placePiece(self.gameState.addInsurgent, poskey);
        },
      },
      {
        signal: 'insurgentMove',
        handler: function(move) {
          return self.movePiece(self.gameState.insurgentMove, move.src, move.dest);
        },
      },
      {
        signal: 'grow',
        handler: function(poskey) {
          return self.gameState.grow(h.Position(poskey));
        },
      },
      {
        signal: 'endTurn',
        handler: function() {
          return self.gameState.endTurn();
        },
      },
    ];

    //----------------------------------------------------------------------------
    Tutorial.prototype.init = function(socket, updatePlayerCB, endTutorialCB) {
      self.socket = socket;
      self.updatePlayerCB = updatePlayerCB;
      self.endTutorialCB = endTutorialCB;

      self.ui = $("<div>\
                     <div class='tutorialBackground'/>\
                     <div class='tutorialForeground'>\
                     </div>\
                     <div class='tutorialButtonContainer'>\
                       <div class='tutorialLabel'>Tutorial Controls:</div>\
                       <div class='tutorialButton restartTutorialButton'>Restart Tutorial</div>\
                       <div class='tutorialButton endTutorialButton'>End Tutorial</div>\
                     </div>\
                   </div>");
      $('body').append(self.ui);

      self.background = self.ui.find('.tutorialBackground');
      self.foreground = self.ui.find('.tutorialForeground');
      self.buttonContainer = self.ui.find('.tutorialButtonContainer');
      self.buttonContainer.find('.restartTutorialButton').click(self.onRestartTutorial);
      self.buttonContainer.find('.endTutorialButton').click(self.onEndTutorial);

      self.ui.hide();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.isActive = function() {
      return self.active;
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.isFinished = function() {
      return self.finished;
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.beginTutorial = function() {
      self.active = true;
      self.adjustTutorialStyles();
      self.initAsymmetricWarfare();
      self.initTutorialSteps();
      self.updatePlayer();
      self.show();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initAsymmetricWarfare = function() {
      self.gameState = new AsymmetricWarfare();
    };

    //----------------------------------------------------------------------------
    // Script is an array that contains the contents of the entire tutorial.
    // See the bottom of this source for details on its structure.
    Tutorial.prototype.show = function() {
      self.finished = false;
      self.ui.show();

      self.performStep(0);
      $(window).on('resize.tutorial', this.onResize);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.hide = function() {
      self.ui.hide();
      $(window).off('resize.tutorial');
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.setInitialGameState = function(gameState) {
      self.initialGameState = gameState;
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.setRole = function(role) {
      self.role = role;
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.isStatePlayer = function() {
      return self.role === h.C.STATE;
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.updatePlayer = function(result) {
      var data = {};
      data.result = result;
      data.history = _.map(self.gameState.history(self.role), function(entry) {
        return entry.toDTO();
      });
      if (self.isStatePlayer()) {
        data.state = self.gameState.state(self.role);
      }

      if (self.updatePlayerCB !== undefined) {
        self.updatePlayerCB(data, true);
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.emit = function(type, data) {
      for (var i = 0; i < self.serverHandlers.length; ++i) {
        if (self.serverHandlers[i].signal === type) {
          var result = self.serverHandlers[i].handler(data);
          setTimeout(function() {
            self.updatePlayer(result);
          }, 0);
          break;
        }
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onRestartTutorial = function() {
      self.onEndTutorial();
      self.beginTutorial();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onEndTutorial = function(isRestart) {
      self.active = false;
      self.finished = true;

      _.each(self.timers, function(timer) {
        clearTimeout(timer);
      });
      self.timers = [];
      self.background.empty();
      self.foreground.empty();
      Opentip.hideTips();
      self.hide();

      if (self.endTutorialCB !== undefined) {
        self.endTutorialCB();
      }

      if (isRestart !== undefined) {
        self.finished = true;
        if (self.updatePlayerCB !== undefined) {
          self.updatePlayerCB(self.initialGameState);
        }
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.performStep = function(step) {
      if (step > -1 && step < self.script.length) {
        self.step = step;
        var currentStep = self.script[step];

        //is this step an array of elements and tips?
        if (_.isArray(currentStep)) {
          var absTime = 0;

          _.each(currentStep, function(item){
            absTime += item.hasOwnProperty('delay') ? item.delay : 0;

            self.timers.push(setTimeout(function() {
              self.performItem(item);
              self.timers.unshift();
            }, absTime));
          });

        }
        else {
          this.timers.push(setTimeout(function() {
            self.performItem(currentStep);
            self.timers.unshift();
          }, currentStep.hasOwnProperty('delay') ? currentStep.delay : 0));
        }

        return;
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.performItem = function(item) {
      var $el = $(item.el);
      var $tooltipTarget = $el;

      if (item.hasOwnProperty('grouped') && item.grouped) {
        //point the tooltip to the bounding box
        $tooltipTarget = self.createBoundingBox($el, 'boundingBox');
      }

      if (item.hasOwnProperty('tip')){
        if (item.tip.stemLength === undefined) {
          item.tip.stemLength = 50;
        }
        var t = new Opentip($tooltipTarget.get(0), item.tip.content, item.tip.title || '',
                            {
                              target: item.tip.target || $tooltipTarget.get(0),
                              group: null,
                              showOn:'creation',
                              hideOn: 'fakeEventThatDoesntExist',
                              removeElementsOnHide: true,
                              stemLength: item.tip.stemLength,
                              tipJoint: item.tip.tipJoint || 'top left',
                              offset: item.tip.offset || [0, 0],
                              delay: item.tip.delay || 0,
                              style: self.doesItemHaveNullAction(item) ? 'tutorialTips' : 'tutorialActionTips'
                            });
        $(t.container[0]).on('click.blockClick', self.onBlockClick);
      }

      $el.each(function() {
        self.cloneElement(this, item)
      });
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onBlockClick = function(event) {
      event.stopPropagation();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.createBoundingBox = function($el, boxClass) {
      //gather boundaries
      var bbox = self.getBoundingBoxOfElements($el);

      //create bounding box around $el
      var $box = $('<div class="' + boxClass + '"></div>')
      self.setCSSOfBoundingBox($box, bbox);

      self.background.append($box);
      $el.data('boundingBox', $box);
      $box.data('source', $el);

      return $box;
    }

    //----------------------------------------------------------------------------
    Tutorial.prototype.getBoundingBoxOfElements = function($elements) {
      //gather boundaries
      var left = Number.MAX_VALUE;
      var top = Number.MAX_VALUE;
      var width = Number.MIN_VALUE;
      var height = Number.MIN_VALUE;

      _.each($elements, function(element){
        var rect = element.getBoundingClientRect();
        left = (rect.left < left) ? rect.left : left;
        top = (rect.top < top) ? rect.top : top;
        width = (rect.width > width) ? rect.width : width;
        height = (rect.height > height) ? rect.height : height;
      });

      return {left: left, top: top, width: width, height: height};
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.setCSSOfBoundingBox = function($el, bbox) {
      $el.css('left', bbox.left);
      $el.css('right', bbox.right);
      $el.css('top', bbox.top);
      $el.css('bottom', bbox.bottom);
      $el.css('width', bbox.width);
      $el.css('height', bbox.height);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.doesItemHaveNullAction = function(item) {
      //step has an action property and it's null, meaning there's no action to perform
      return (item.hasOwnProperty('action') &&
              (item.action == null));
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.cloneElement = function(element, item, alternate) {
      // Clone the element
      var $el = $(element);
      if (item.hasOwnProperty('shallowCopy') && item.shallowCopy) {
        var $clone = $(element.cloneNode(true));
      }
      else {
        var $clone = $el.clone(true);
      }
      $clone.data('source', $el);

      // Add the clone to the appropriate layer
      if (item.hasOwnProperty('action') && alternate === undefined) {
        self.background.append($clone);
        if (item.action !== null) {
          var alternateTarget = $(item.action)[0];
          self.cloneElement(alternateTarget, item, true);
        }
      }
      else {
        self.foreground.append($clone);

        //Highlight the elements which have some action to perform and assign
        //a click handler
        if (!item.hasOwnProperty('suppressHighlightCircle')) {
          var $box = $("<div class='highlightCircle'></div>")
          var bbox = self.getBoundingBoxOfElements($el);
          if (item.hasOwnProperty('highlightBounds')) {
            bbox = item.highlightBounds;
          }
          self.setCSSOfBoundingBox($box, bbox);
          $box.data('source', $el);
          self.foreground.append($box);
          $box.click(function() {
            $clone.click();
            self.onFinished();
          });
        }
      }

      // Now position the element
      //$clone.copyCSS($el);
      $clone.css('transition', 'none');
      $clone.css('position', 'absolute');
      self.positionClone($clone, $el);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.positionClone = function($clone, $el) {
      $clone.offset($el.offset());
      $clone.css('width', $el.width());
      $clone.css('height', $el.height());
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.cleanUpElement = function($el) {
      if ($el.data('boundingBox')) {
        var $bbox = $el.data('boundingBox');
        $bbox.remove();
        $el.removeData('boundingBox');
      }

      Opentip.hideTips();
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onResize = function() {
      setTimeout(function() {
        self.background.add(self.foreground).children().each(function() {
          if ($(this).hasClass('boundingBox') || $(this).hasClass('highlightCircle')) {
            self.setCSSOfBoundingBox($(this), self.getBoundingBoxOfElements($(this).data('source')));
          }
          else {
            self.positionClone($(this), $(this).data('source'));
          }
        });
        _.each(Opentip.tips, function(tip) {
          tip.reposition();
        });
      }, 0);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.onFinished = function(event) {
      // Cleanup our previous clones
      self.background.empty();
      self.foreground.empty();

      // Move on to the next step of the tutorial
      if (_.isArray(self.script[self.step])) {
        _.each(self.script[self.step], function(item) {
          if (item.callback != null) {
            item.callback();
          }
          self.cleanUpElement($(item.el));
        });
      }
      else {
        if (self.script[self.step].callback != null) {
          self.script[self.step].callback();
        }
        self.cleanUpElement($(self.script[self.step].el));
      }

      self.step++;

      if (self.step < self.script.length) {
        self.performStep(self.step);
      }
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.adjustTutorialStyles = function() {
      // Change the background style based on the player's role
      if (!self.background.hasClass('stateTutorialBackground') || !self.background.hasClass('guerrillaTutorialBackground')) {
        if (self.isStatePlayer()) {
          self.background.addClass('stateTutorialBackground');
        }
        else {
          self.background.addClass('insurgentTutorialBackground');
        }
      }

      // Change the tooltip styles based on the player's role
      if (Opentip.styles.tutorialActionTips === undefined || Opentip.styles.tutorialTips === undefined) {
        if (self.isStatePlayer()) {
          Opentip.styles.tutorialActionTips = {
            extends: "tutorialTips",
            className: "stateTutorialActionTips",
            borderColor: "yellow",
            borderWidth: 1,
            background: [[0, "rgba(91, 103, 119, 0.8)"], [1, "rgba(69, 83, 96, 0.9)"]]
          };

          Opentip.styles.tutorialTips = {
            extends: "dark",
            className: "stateTutorialTips",
            borderColor: "#000",
            borderWidth: 1,
            background: [[0, "rgba(196, 215, 229, 0.95)"], [1, "rgba(153, 168, 179, 0.95)"]],
          };
        }
        else {
          Opentip.styles.tutorialActionTips = {
            extends: "tutorialTips",
            className: "insurgentTutorialActionTips",
            borderColor: "yellow",
            borderWidth: 1,
            background: [[0, "rgba(103, 96, 77, 0.8)"], [1, "rgba(69, 63, 50, 0.9)"]]
          };

          Opentip.styles.tutorialTips = {
            extends: "dark",
            className: "insurgentTutorialTips",
            borderColor: "#000",
            borderWidth: 1,
            background: [[0, "rgba(220, 212, 193, 0.9)"], [1, "rgba(210, 197, 163, 0.95)"]],
          };
        }
      }
    };
  };

  return new Tutorial;
});

//----------------------------------------------------------------------------
// Computed CSS Style Copy Functions
// Origin: http://stackoverflow.com/questions/754607/can-jquery-get-all-css-styles-associated-with-an-element/6416527#6416527
//----------------------------------------------------------------------------
(function($){
  $.fn.getStyleObject = function(){
    var dom = this.get(0);
    var style;
    var returns = {};
    if(window.getComputedStyle) {
      var camelize = function(a,b) {
        return b.toUpperCase();
      };
      style = window.getComputedStyle(dom, null);
      for(var i = 0, l = style.length; i < l; i++) {
        var prop = style[i];
        var camel = prop.replace(/\-([a-z])/g, camelize);
        var val = style.getPropertyValue(prop);
        returns[camel] = val;
      };
      return returns;
    };
    if(style = dom.currentStyle) {
      for(var prop in style){
        returns[prop] = style[prop];
      };
      return returns;
    };
    return this.css();
  }
})(jQuery);

$.fn.copyCSS = function(source){
  var styles = $(source).getStyleObject();
  this.css(styles);
}

//----------------------------------------------------------------------------
// Script data structure
//
// [ array for each step of the script
//  {el: <JQuery selector> //these elements will be highlighted
//   action: <JQuery selector> //if undefined, a 'click' on el will move to next tutorial step
//                             //if null, no events on el will be used to proceed to next tutorial step
//                             //if defined, a 'click' on these elements will proceed to the next tutorial step
//   tip: {         //a tooltip to be displayed
//    title: <text> //the text to use as a title for this tip
//    content: <text> //the text to use as context for this tip
//    target: <Jquery selector> //which element this tip will point to.
//                              //if undefined, the el will be used
//    stemLength: <number> //how far away the tool tip will be to the element
//    tipJoint: <(top,middle,bottom) (left, center, right)> //which direction to project the tool tip
//   }
//   grouped: <boolean> //if a bounding box should be rendered around el or not
//   callback: <function> //a callback function that gets called at the end of this tutorial step
//  }

//  //a single step can have multiple elements/tips defined.
//  //E.g. First step has two elements defined, second step has one
// [{el:''},
//  {el:''}],
// {el: ''}
// ]
