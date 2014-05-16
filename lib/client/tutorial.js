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
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initInsurgentTutorialSteps = function() {
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
    // Defined 'fake' server handlers for taking turns.
    self.serverHandlers = [
      //{
      //  signal: 'placeGuerrilla',
      //  handler: function(piece) {
      //    return self.gameState.placeGuerrillaPiece(piece.position);
      //  },
      //},
      //{
      //  signal: 'moveCOIN',
      //  handler: function(data) {
      //    return self.gameState.moveSoldierPiece(data.piece, data.position);
      //  },
      //},
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
        //gather boundaries
        var bbox = self.getBoundingBoxOfElements($el);

        //create bounding box around $el
        var $box = $("<div class='boundingBox'></div>")
        self.setCSSOfBoundingBox($box, bbox);

        self.background.append($box);
        $el.data('boundingBox', $box);
        $box.data('source', $el);

        //point the tooltip to this box
        $tooltipTarget = $box;
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
    Tutorial.prototype.getBoundingBoxOfElements = function($elements) {
      //gather boundaries
      var left = Number.MAX_VALUE;
      var right = Number.MIN_VALUE;
      var bottom = Number.MIN_VALUE;
      var top = Number.MAX_VALUE;

      _.each($elements, function(element){
        var rect = element.getBoundingClientRect();
        left = (rect.left < left) ? rect.left : left;
        right = (rect.right > right) ? rect.right : right;
        bottom = (rect.bottom > bottom) ? rect.bottom : bottom;
        top = (rect.top < top) ? rect.top : top;
      });

      return {left:left, right:right, top:top, bottom:bottom};
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.setCSSOfBoundingBox = function($el, bbox) {
      $el.css('left', bbox.left);
      $el.css('right', bbox.right);
      $el.css('top', bbox.top);
      $el.css('bottom', bbox.bottom);
      $el.css('width', bbox.right-bbox.left);
      $el.css('height', bbox.bottom-bbox.top);
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
        $clone.one('click', self.onFinished); //click handler
        self.foreground.append($clone);

        //Highlight the elements which have some action to perform and assign
        //a click handler
        var $box = $("<div class='highlightCircle'></div>")
        var bbox = self.getBoundingBoxOfElements($el);
        self.setCSSOfBoundingBox($box, bbox);
        $box.data('source', $el);
        self.foreground.append($box);
        $box.click(function() {
          $clone.click();
        });
      }

      // Now position the element
      $clone.copyCSS($el);
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
