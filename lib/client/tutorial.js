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

    self.opponentDelay = 750;
    self.clickDelay = 0;

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
        ////// TURN 1 //////
        // Step 1
        [{
          el: '#board',
          tip: {
            title: 'Asymmetric Warfare',
            content: 'In this game, the State player is trying to kill the Insurgent forces and the Insurgent player is trying to take over the Capital (the center of the map).',
            tipJoint: 'left',
            offset: [-7, 0],
            stemLength: 20,
          },
          action: null,
        },

        {
          el: '#marker0-0 > .content',
          tip: {
            title: 'Insurgents',
            content: 'The Insurgent player starts with 5 pieces on the map, but you can only see them when they are in the same space as other Insurgent pieces or any State piece.',
            tipJoint: 'top',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to select a piece to move.',
            offset: [5, -274],
            tipJoint: 'top',
          },
          action: '#space4-0',
          highlightBounds: {left: 597, top: 295, width: 71, height: 71},
        }],

        // Step 2
        [{
          el: '#moves_left',
          tip: {
            title: 'Movement',
            content: 'Both players get 2 movement points each turn to move their forces.',
            tipJoint: 'top',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move your piece.',
            offset: [30, -339],
            tipJoint: 'top',
          },
          action: '#space3-11',
          highlightBounds: {left: 630, top: 227, width: 55, height: 73},
        }],

        // Step 3
        [{
          el: '#marker4-0 > .content',
          tip: {
            title: 'Split Movement',
            content: 'Movement can be split between two pieces or all used on a single piece.',
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to select a piece to move.',
            offset: [5, -274],
            tipJoint: 'top',
          },
          action: '#space4-0',
          highlightBounds: {left: 597, top: 295, width: 71, height: 71},
        }],

        // Step 4
        [{
          el: '#marker0-0 > .content',
          tip: {
            title: 'Insurgent Growth',
            content: 'The Insurgent player can get more pieces when he has two or more pieces on the same location.',
            tipJoint: 'top',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move your piece.',
            offset: [-18, -207],
            tipJoint: 'top',
          },
          action: '#space3-5',
          highlightBounds: {left: 583, top: 361, width: 52, height: 72},
          callback: self.moveInsurgentTurnOne,
        }],

        ////// TURN 2 //////
        // Step 5
        [{
          el: '#marker3-8, #marker3-10, #marker3-2, #marker3-4',
          grouped: true,
          tip: {
            title: 'Inner Circle Limit',
            content: 'Only three State pieces can be in the Inner Circle (the ring adjacent to the Capital) at once.',
            tipJoint: 'right',
          },
          delay: self.opponentDelay * 2,
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to select a piece to move.',
            offset: [30, 199],
            tipJoint: 'bottom',
          },
          action: '#space3-11',
          highlightBounds: {left: 630, top: 227, width: 55, height: 73},
        }],

        // Step 6
        [{
          el: '#marker2-0 > .content',
          tip: {
            title: 'Crossing Circles',
            content: 'Moving from one circle to the next costs 2 movement points, with the exception of moving through the Capital.',
            offset: [5, 0],
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move your piece.',
            offset: [74, -382],
            tipJoint: 'top',
          },
          action: '#space2-0',
          highlightBounds: {left: 657, top: 169, width: 93, height: 90},
          callback: self.moveInsurgentTurnTwo,
        }],

        ////// TURN 3 //////
        // Step 7
        [{
          el: '#marker3-8, #marker3-10, #marker3-2, #marker3-4',
          grouped: true,
          tip: {
            title: 'Insurgent Victory',
            content: 'The Insurgent player wins when he has either four adjacent pieces or six non-adjacent pieces in the Inner Circle.',
            tipJoint: 'top',
          },
          delay: self.opponentDelay * 2,
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to select a piece to move.',
            offset: [74, 142],
            tipJoint: 'bottom',
          },
          action: '#space2-0',
          highlightBounds: {left: 657, top: 169, width: 93, height: 90},
        }],

        // Step 8
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move your piece.',
            offset: [5, -402],
            tipJoint: 'top',
          },
          action: '#space2-11',
          highlightBounds: {left: 587, top: 163, width: 90, height: 74},
        }],

        // Step 9
        [{
          el: '#interrogate',
          tip: {
            title: 'Interrogate',
            content: 'When one of your pieces is in the same space as an Insurgent piece, you can interrogate it to learn about all adjacent Insurgent pieces.',
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
          el: '#interrogate',
          tip: {
            content: 'Click here to Interrogate an Insurgent.',
            tipJoint: 'right',
          },
        }],

        // Step 10
        [{
          el: '#marker2-11 > .content',
          tip: {
            title: 'Interrupted Movement',
            content: 'If you have moved any piece this turn, then your turn will end if you Kill or Interrogate an Insurgent.',
            offset: [5, 0],
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to Interrogate this Insurgent.',
            offset: [5, -402],
            tipJoint: 'top',
          },
          action: '#space2-11',
          highlightBounds: {left: 587, top: 163, width: 90, height: 74},
          callback: self.moveInsurgentTurnThree,
        }],

        ////// TURN 4 //////
        // Step 11
        [{
          el: '#kill',
          tip: {
            title: 'Kill',
            content: 'You can kill any Insurgents sharing a space with one of your State pieces.  This will kill <strong>all</strong> Insurgents in that space.',
            tipJoint: 'bottom',
          },
          delay: self.opponentDelay * 2,
          action: null,
        },

        {
          el: '#kill',
          tip: {
            content: 'Click here to Kill Insurgents.',
            tipJoint: 'right',
          },
        }],

        // Step 12
        [{
          el: '#killed_insurgents',
          tip: {
            title: 'State Victory',
            content: 'You win the game if you kill 12 or more Insurgent pieces.',
            tipJoint: 'top',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to kill these Insurgents.',
            offset: [5, -402],
            tipJoint: 'top',
          },
          action: '#space2-11',
          highlightBounds: {left: 587, top: 163, width: 90, height: 74},
        }],

        // Step 13
        [{
          el: '#marker1-0',
          shallowCopy: true,
          tip: {
            title: 'Interrogation Markers',
            content: 'When you interrogate a terrorist, a shadow piece will appear for any Insurgent pieces connected to the given Insurgent.  These shadow pieces will fade a little each turn to indicate how old the information is.',
            tipJoint: 'right',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to select a piece to move.',
            offset: [5, -402],
            tipJoint: 'top',
          },
          action: '#space2-11',
          highlightBounds: {left: 587, top: 163, width: 90, height: 74},
        }],

        // Step 14
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move this piece.',
            offset: [65, -448],
            tipJoint: 'top',
          },
          action: '#space1-0',
          highlightBounds: {left: 630, top: 97, width: 120, height: 92},
        }],

        // Step 15
        [{
          el: '#marker1-0',
          shallowCopy: true,
          tip: {
            title: 'Old Information',
            content: 'Interrogation shadow pieces are only accurate at the time of the interrogation, so if the Insurgent moves before you move a piece there, you won\'t know.',
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
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
    Tutorial.prototype.moveInsurgentTurnOne = function() {
      setTimeout(function() {
        self.placePiece(self.gameState.grow, '1,0');
        self.movePiece(self.gameState.insurgentMove, '1,0', '2,11');
        self.updatePlayer();
      }, self.opponentDelay);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveInsurgentTurnTwo = function() {
      setTimeout(function() {
        self.movePiece(self.gameState.insurgentMove, '0,3', '0,2');
        self.movePiece(self.gameState.insurgentMove, '0,2', '0,1');
        self.placePiece(self.gameState.grow, '1,0');
        self.updatePlayer();
      }, self.opponentDelay);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveInsurgentTurnThree = function() {
      setTimeout(function() {
        self.movePiece(self.gameState.insurgentMove, '1,0', '1,1');
        self.gameState.endTurn();
        self.updatePlayer();
      }, self.opponentDelay);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.initInsurgentTutorialSteps = function() {
      self.script = [
        ////// TURN 1 //////
        // Step 1
        [{
          el: '#board',
          tip: {
            title: 'Asymmetric Warfare',
            content: 'In this game, the State player is trying to kill the Insurgent forces and the Insurgent player is trying to take over the Capital (the center of the map).',
            tipJoint: 'left',
            offset: [-7, 0],
            stemLength: 20,
          },
          action: null,
        },

        {
          el: '#setup > span',
          tip: {
            title: 'Setup',
            content: 'The Insurgent player starts with five pieces that you can place on the outermost circle of the map.',
            tipJoint: 'top',
            offset: [0, -3],
            stemLength: 20,
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to place your first piece.',
            offset: [5, -530],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        // Step 2
        [{
          el: '#board',
          tip: {
            title: 'Player Information',
            content: 'The Insurgent forces\' positions are hidden from the State player unless they are in the same space as any other piece (State or Insurgent).',
            tipJoint: 'left',
            offset: [-7, 0],
            stemLength: 20,
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to place your second piece.',
            offset: [5, -530],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        // Step 3
        [{
          el: '#marker4-0 > .content',
          tip: {
            title: 'State Pieces',
            content: 'The State player has 5 pieces to try to find the Insurgent pieces with.',
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to place your third piece.',
            offset: [3, -3],
            tipJoint: 'right',
          },
          action: '#space0-9',
          highlightBounds: {left: 334, top: 253, width: 79, height: 155},
        }],

        // Step 4
        [{
          el: '#marker3-8, #marker3-10, #marker3-2, #marker3-4',
          grouped: true,
          tip: {
            title: 'Insurgent Victory',
            content: 'The Insurgent player wins if you have Insurgent pieces occupying either four adjacent spaces or six non-adjacent spaces in the Inner Circle (the spaces adjacent to the Capital).',
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to place your fourth piece.',
            offset: [3, -3],
            tipJoint: 'left',
          },
          action: '#space0-3',
          highlightBounds: {left: 853, top: 253, width: 79, height: 155},
        }],

        // Step 5
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to place your fifth piece.',
            offset: [5, 530],
            tipJoint: 'bottom',
          },
          action: '#space0-6',
          highlightBounds: {left: 555, top: 553, width: 155, height: 76},
          callback: self.moveStateTurnOne,
        }],

        ////// TURN 2 //////
        // Step 6
        [{
          el: '#grow',
          tip: {
            title: 'Grow',
            content: 'The Insurgent player may get up to 10 more pieces by having at least two Insurgent pieces in the same space and clicking Grow.',
            tipJoint: 'top',
          },
          delay: self.opponentDelay * 2,
          action: null,
        },

        {
          el: '#grow',
          tip: {
            content: 'Click here now to get another Insurgent piece.',
            tipJoint: 'right',
          },
        }],

        // Step 7
        [{
          el: '#marker0-11',
          tip: {
            title: 'Adjacent Spaces',
            content: 'Movement and growth both occur on adjacent spaces (any space that borders with the origin space).',
            tipJoint: 'right',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to place your new Insurgent piece.',
            offset: [65, -448],
            tipJoint: 'top',
          },
          action: '#space1-0',
          highlightBounds: {left: 630, top: 97, width: 120, height: 92},
        }],

        // Step 8
        [{
          el: '#moves_left',
          tip: {
            title: 'Movement',
            content: 'Both players get 2 movement points each turn to move their forces.',
            tipJoint: 'top',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to select this piece to move.',
            offset: [5, -530],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        // Step 9
        [{
          el: '#marker1-11',
          tip: {
            title: 'Crossing Circles',
            content: 'Changing which circle a piece is on takes 2 movement points, with the exception of the Capital, which only takes 1 point to enter/leave.',
            tipJoint: 'right',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move your piece to this space.',
            offset: [-50, -448],
            tipJoint: 'top',
          },
          action: '#space1-11',
          highlightBounds: {left: 515, top: 97, width: 120, height: 92},
          callback: self.moveStateTurnTwo,
        }],

        ////// TURN 3 //////
        // Step 10
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move this piece.',
            offset: [-50, -448],
            tipJoint: 'top',
          },
          delay: self.opponentDelay * 2,
          action: '#space1-11',
          highlightBounds: {left: 515, top: 97, width: 120, height: 92},
        }],

        // Step 11
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move the piece to this space.',
            offset: [65, -448],
            tipJoint: 'top',
          },
          action: '#space1-0',
          highlightBounds: {left: 630, top: 97, width: 120, height: 92},
        }],

        // Step 12
        [{
          el: '#marker0-0',
          shallowCopy: true,
          tip: {
            title: 'Split Movement',
            content: 'You can split your movement points between multiple pieces as long as they both rotate around their own circles.',
            tipJoint: 'right',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move this piece.',
            offset: [5, -530],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        // Step 13
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move the piece to this space.',
            offset: [140, -470],
            tipJoint: 'top',
          },
          action: '#space0-1',
          highlightBounds: {left: 690, top: 43, width: 155, height: 126},
        }],

        // Step 14
        [{
          el: '#end_turn',
          tip: {
            title: 'End Turn',
            content: 'If you want to end your turn without growing and/or moving, you can click End Turn.',
            tipJoint: 'bottom',
          },
          action: null,
        },

        {
          el: '#end_turn',
          tip: {
            content: 'Click here to end your turn now.',
            tipJoint: 'right',
          },
          callback: self.moveStateTurnThree,
        }],

        ////// TURN 4 //////
        // Step 15
        [{
          el: '#marker1-0',
          shallowCopy: true,
          tip: {
            title: 'State Interrogation',
            content: 'When a State and Insurgent piece are in the same space, the State player can interrogate the Insurgent to learn the location of all connected Insurgent pieces.',
            tipJoint: 'right',
          },
          delay: self.opponentDelay * 2,
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move this piece.',
            offset: [140, -470],
            tipJoint: 'top',
          },
          action: '#space0-1',
          highlightBounds: {left: 690, top: 43, width: 155, height: 126},
        }],

        // Step 16
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move the piece to this space.',
            offset: [5, -530],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        // Step 17
        [{
          el: '#marker0-0',
          shallowCopy: true,
          tip: {
            title: 'Move Around Circle',
            content: 'You can spend your movement points on the same piece to move them two spaces around the same circle.',
            tipJoint: 'left',
          },
          action: null,
        },

        {
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move the same piece.',
            offset: [5, -530],
            tipJoint: 'top',
          },
          action: '#space0-0',
          highlightBounds: {left: 555, top: 31, width: 155, height: 76},
        }],

        // Step 18
        [{
          el: '#selection_wrapper',
          tip: {
            content: 'Click here to move the piece to this space.',
            offset: [-130, -470],
            tipJoint: 'top',
          },
          action: '#space0-11',
          highlightBounds: {left: 420, top: 43, width: 155, height: 126},
        }],

        // Step 19
        [{
          el: '#end_turn',
          tip: {
            content: 'Click here to end your turn now.',
            tipJoint: 'right',
          },
          callback: self.moveStateTurnFour,
        }],

        ////// TURN 5 //////
        // Step 20
        [{
          el: '#marker1-0',
          shallowCopy: true,
          tip: {
            title: 'State Kill',
            content: 'As well as interrogating Insurgents, the State pieces can kill all Insurgent pieces in a shared space in one turn.',
            tipJoint: 'top',
          },
          delay: self.opponentDelay * 3,
          action: null,
        },

        {
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
      }, self.opponentDelay);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveStateTurnTwo = function() {
      setTimeout(function() {
        self.movePiece(self.gameState.stateMove, '3,0', '2,0');
        self.gameState.endTurn();
        self.updatePlayer();
      }, self.opponentDelay);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveStateTurnThree = function() {
      setTimeout(function() {
        self.movePiece(self.gameState.stateMove, '2,0', '1,0');
        self.gameState.interrogate(h.Position('1,0'));
        self.updatePlayer();
      }, self.opponentDelay);
    };

    //----------------------------------------------------------------------------
    Tutorial.prototype.moveStateTurnFour = function() {
      setTimeout(function() {
        self.gameState.kill(h.Position('1,0'));
        self.updatePlayer();
      }, self.opponentDelay);
      setTimeout(function() {
        self.movePiece(self.gameState.stateMove, '4,0', '3,9');
        self.updatePlayer();
      }, self.opponentDelay * 2);
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
        signal: 'stateMove',
        handler: function(move) {
          return self.movePiece(self.gameState.stateMove, move.src, move.dest);
        },
      },

      {
        signal: 'insurgentMove',
        handler: function(move) {
          return self.movePiece(self.gameState.insurgentMove, move.src, move.dest);
        },
      },

      {
        signal: 'kill',
        handler: function(poskey) {
          return self.gameState.kill(h.Position(poskey));
        },
      },

      {
        signal: 'interrogate',
        handler: function(poskey) {
          return self.gameState.interrogate(h.Position(poskey));
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
      var right = Number.MIN_VALUE;
      var bottom = Number.MIN_VALUE;

      _.each($elements, function(element){
        var rect = element.getBoundingClientRect();
        left = (rect.left < left) ? rect.left : left;
        top = (rect.top < top) ? rect.top : top;
        right = (rect.right > right) ? rect.right : right;
        bottom = (rect.bottom > bottom) ? rect.bottom : bottom;
      });

      return {left: left, top: top, width: right - left, height: bottom - top};
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
        var $clone = $(element.cloneNode(false));
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
            $box.data('highlightBounds', bbox);
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
            if ($(this).data('highlightBounds') !== undefined) {
              self.setCSSOfBoundingBox($(this), $(this).data('highlightBounds'));
            }
            else {
              self.setCSSOfBoundingBox($(this), self.getBoundingBoxOfElements($(this).data('source')));
            }
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
