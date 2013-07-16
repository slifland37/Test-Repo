/*
 * GLOBAL TODO:
 * - (only allow bottom email to be dragged?)
 * - implement game logic
 * - splash screen
 * - get proper resolution
 * - detect mobile vs browser, and set resolution appropriately
 */

/*
 * BUGS:
 * - multi-touch causes issues - ignore more than one finger?
 * - dragged email goes behind others
 */

var messages = [
  ['My tummy hurts', 'Doctor'],
  ['Wow! You\'re a crazy chef!', 'Crazy Chef'],
  ['Please help me find work!', 'Employment Agent'],
  ['My sofa is terrible!', 'Customer Service'],
  ['This food is weird', 'Crazy Chef'],
  ['There\'s something growing on my feet.', 'Doctor'],
  ['Could you help my wife? She\'s sick.', 'Doctor'],
  ['I\'m looking for a job at the health clinic', 'Employment Agent'],
  ['My shirt doesn\'t fit!', 'Customer Service']
];

var mailQueue = [];
var gameWidth = 320;
var gameHeight = 480;
var floorHeight = 20;
var stageHeight = gameHeight - floorHeight;

Game = {

  makeMail: function (message, inbox) {
    return Crafty.e('Email').text(message).inbox(inbox);
  },

  moveMail: function (messageBlock, newX, newY, frames) {
    messageBlock.antigravity(); // Disabling gravity preserves animation
    messageBlock.tween({x: newX, y: newY}, frames);
    // messageBlock.attr({x: newX, y: newY}); // instantly jump mail back
  },

  bindDragToEmail: function (email) {
    email.bind('StartDrag', function () {

      // Set z-index from 0 to 1 to raise this above other emails
      email.z = 1;

      // Record (x, y) so we can move it back
      this._oldX = this.x;
      this._oldY = this.y;
      // console.log("x: " + this._oldX + "\n"
      //             + "y: " + this._oldY + "\n");

      mailQueue.forEach(function (element, index, array) {
        element.antigravity();
        if (element != email) {
          // console.log("Disabling drag for email (" + element._text + ")");

          // Only allow one email to be taken out of queue at a time
          // Re-enabled after tween
          element.disableDrag();
        }
      });
    });

    /* Make sure we're not going out of bounds while being dragged */
    email.bind('Dragging', function () {
        if (this.x < 0) {
          this.x = 0;
        } else if (this.x > gameWidth - this.w) {
          this.x = gameWidth - this.w;
        }
        if (this.y < 0) {
          this.y = 0;
        } else if (this.y > gameHeight - floorHeight - this.h) {
          this.y = gameHeight - floorHeight - this.h;
        }
      });

    email.bind('StopDrag', function () {
    /* Collision TODO:
       * --------------
       * Correct collision:
       *   - score
       * Incorrect collision:
       *   - animate email back to old position (jump working)
       */
      var collisionObjects = this.hit('Inbox');
      /*
       * Only score if we've exclusively hit the correct inbox
       */
      if (collisionObjects
          && collisionObjects.length === 1
          && this.goesIn(collisionObjects[0].obj))
      {
        // Remove email from queue and destroy it
        mailQueue.splice(mailQueue.indexOf(email), 1)[0].destroy();
        // Allow all other emails to fall and be draggable
        mailQueue.forEach(function (element, index, array) {
          element.gravity('Solid');
          element.enableDrag();
        });
        // TODO: score
      }
      else
      {
        // put it back
        Game.moveMail(email, this._oldX, this._oldY, 20);
      }

      // Either way, disable drag so email can tween back to its spot
      // without being interrupted
      email.disableDrag();
    });
  },

  bindTweenToEmail: function (email) {
    email.bind('TweenEnd', function () {

      // Lower the email's z-index back to 0
      email.z = 0;

      mailQueue.forEach(function (element, index, array) {
        element.enableDrag();
        element.gravity('Solid');
      });
    });
  },


  /*
   * Initialize and start our game
   */
  start: function () {
    // Start crafty and set a background color so that we can see it's working
    Crafty.init(gameWidth, gameHeight);
    Crafty.background('rgb(249, 223, 125)');

    // Put down floor
    var floor = Crafty.e('Floor')
      .attr({w: gameWidth,
             h: floorHeight,
             x: 0,
             y: gameHeight - floorHeight});

    // Place inboxes
    var customerService = Crafty.e('Inbox')
          .attr({x: Math.floor(gameWidth * 2.0/3.0) + 1,
                 y: 0})
          .color('yellow')
          .text('Customer Service')
          .unselectable();

    var doctor = Crafty.e('Inbox')
          .attr({x: Math.floor(gameWidth * 2.0/3.0) + 1,
                 y: Math.floor(stageHeight / 4.0)})
          .color('blue')
          .text('Doctor')
          .unselectable();

    var employmentAgent = Crafty.e('Inbox')
          .attr({x: Math.floor(gameWidth * 2.0/3.0) + 1,
                 y: Math.floor( (stageHeight / 4.0) * 2 )})
          .color('orange')
          .text('Employment Agent')
          .unselectable();

    var crazyChef = Crafty.e('Inbox')
          .attr({x: Math.floor(gameWidth * 2.0/3.0) + 1,
                 y: Math.floor( (stageHeight / 4.0) * 3 )})
          .color('pink')
          .text('Crazy Chef')
          .unselectable();

    // Create mail queue
    for (var i=0; i < messages.length; i++) {
      mailQueue.push(Game.makeMail(messages[i][0], messages[i][1]));
      Crafty.timer.simulateFrames(100);
      Game.bindDragToEmail(mailQueue[i]);
      Game.bindTweenToEmail(mailQueue[i]);
    }
  }
};