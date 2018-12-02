const Monopoly = require("../");
const render = require('./render/text');
const commandLineArgs = require('command-line-args');

const Interactions = require('./Interactions');

var readline = require('readline');

if (!("Interface" in readline)) {
  readline = require("./readline-browser-polyfill");

}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);


const options = commandLineArgs([
  {
    name: 'teams',
    alias: 't',
    type: Number
  },
  {
    name: 'wallet',
    alias: 'w',
    type: Number
  }
]);

const game = new Monopoly({
  board: {},
  teams: options.teams || 2,
  wallet: options.wallet || 5000
});

const navigationModes = ["fields", "team"];

// There normally exist 4 sides
const sides = 4;
// Amount of fields per side (10) (Practically, it is 11 but important for the calculation is just 10)
const fieldsPerSide = game.board.map.length / sides;

const fieldTypeEmojis = {
  Station: field => "🚂",
  Police: field => "🚔🚨",
  Jail: field => "🔒👮",
  Action: field => ({
    chance: " ?",
    chest: "📦"
  })[field.kind],
  Start: field => "🚩",
  Tax: field => "💰",
  Company: field => ({
    electricity: "💡",
    water: "🚰"
  })[field.kind],
  Empty: field => "🚘"
};

const buildingSymbols = {
  normal: "🏠",
  hotel: "🏰"
};



const pieceSymbols = ["🚎", "🐧", "🗿", "🚀", "🦄", "🎷", "🚁", "🎓"];
const groupSymbols = ["🖤", "💠", "💜", "🧡", "🔴", "💛", "💚", "🔵"];

const focus = {
  index: 0,
  get side() {
    return Math.trunc(this.index / fieldsPerSide);
  },
  mode: "fields"
};

const interactions = new Interactions();


const session = {
  get focus() {
    return focus.index;
  },
  get pieces() {
    return game.teams.map(team => team.piece.position);
  },
  get interactions() {
    return interactions.list.map(interaction => interaction.text);
  }
};


process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  }
  else {
    const supportedKeys = {
      up: handleUserGesture,
      right: handleUserGesture,
      down: handleUserGesture,
      left: handleUserGesture,
      //return: enterField,
      tab: function switchMode() {

      }
    };
    if (key.name in supportedKeys) {
      supportedKeys[key.name](key.name);
      game.emit("change");
    }
    else {
      //console.log(key.name);
    }
  }
});


function handleUserGesture(direction) {

  handleFieldMode();


  function handleFieldMode() {
    const relIndex = focus.index % fieldsPerSide;



    const sideDirections = [
      {
        up: 1,
        right: fieldsPerSide + 2 * (fieldsPerSide - relIndex),
        down: -1,
        left: 0
      },
      {
        up: 0,
        right: 1,
        down: fieldsPerSide + 2 * (fieldsPerSide - relIndex),
        left: -1
      },
      {
        up: -1,
        right: 0,
        down: 1,
        left: fieldsPerSide + 2 * (fieldsPerSide - relIndex)
      },
      {
        up: fieldsPerSide + 2 * (fieldsPerSide - relIndex),
        right: -1,
        down: 0,
        left: 1
      }
    ];
    // List of sides that are bordering on each other (Is just used for the first field of a side because the bordering side on the last field is not important)
    const sideBorderings = [
      {
        side: 3, // Side 3 is bordering to side 0
        direction: "right" // At right side
      },
      {
        side: 0, // Side 0 is bordering to side 1
        direction: "down" // At bottom side
      },
      {
        side: 1, // Side 1 is bordering to side 2
        direction: "left" // At left side
      },
      {
        side: 2, // Side 2 is bordering to side 3
        direction: "up" // At top side
      }
    ];

    const directionRouter = sideDirections[focus.side];

    const isCornerField = !(focus.index % fieldsPerSide);

    // If the current field is a corner field, use the information from 'sideBorderings' to route to the field before
    if (isCornerField) {
      // The related information that defines which "direction" should be used from the bordeirng "side"
      const sideBeforeBordering = sideBorderings[focus.side];
      directionRouter[sideBeforeBordering.direction] = sideDirections[sideBeforeBordering.side][sideBeforeBordering.direction];
    }

    focus.index += directionRouter[direction];

    // % = Make loop possible (index 40 or higher)
    focus.index = focus.index % game.board.map.length;

    // Because this algorithm emits index -1 (when going reverse direction)
    if (focus.index < 0) {
      focus.index = game.board.map.length + focus.index;
    }

    interactions.removeByProperty("id", "mortage");
  }

}

var lastDrawnHeight;

game.on("change", function() {
  var drawString = render(game, session);

  const drawStringHeight = drawString.split("\n").length;

  if (lastDrawnHeight) {

  }
  process.stdout.write('\033c');

  process.stdout.write(drawString + "\n");

  lastDrawnHeight = drawStringHeight;

});
game.on("payment", function(payment) {
  //console.log("Payment!", payment);
});

const current = {
  team: game.teams[0]
};

function getRandomMove() {
  //return 4;
  return Math.round(Math.random() * 12);
}

const steps = [30, 1, 1, 1, 1, 1, 1];
var count = 0;

var ignoreNext = false;

function move() {
  if (current.team.jail) {
    current.team.jail = false;
    current.team = game.teams[(current.team.index + 1) % game.teams.length];
  }

  const realTeamNumber = current.team.index + 1;
  const interactionText = interactions.add({
    description: "Team " + realTeamNumber + " " + pieceSymbols[current.team.index] + " has to move...",
    keys: ["return"],
    id: "info",
    callback() {
      /*ui.dialog("Steps", {
        buttons: ["OK"], // List of buttons (maximum 3)
        default: 0 // Index of default button
      }, "1", function(err, result) {
        if (err) return console.error(err);

        // Return pressed button and (if existing entered text)
        const nextMove = new Number(result.text);

        const movement = current.team.move(nextMove);

        handleMovement(movement, interactionText);
      });*/
      const nextMove = getRandomMove();

      const movement = current.team.move(nextMove);

      if (ignoreNext) {

      }

      handleMovement(movement, interactionText, ignoreNext);

      count++;

    }
  });

}

move();
game.emit("change");



function handleMovement(movement, interactionText, ignoreNext = false) {
  return new Promise(function(resolve, reject) {
    const targetSymbol = groupSymbols[movement.target.group] || fieldTypeEmojis[movement.target.type](movement.target);

    const teamNameWithIcon = current.team.name + " " + pieceSymbols[current.team.index];

    // Change movement interaction text to success of movement
    interactionText.appendProperties({
      description: teamNameWithIcon + " moved " + movement.steps + " fields to " + targetSymbol + " " + movement.target.name + "!",
      keys: []
    });
    //interactions.removeByProperty("id", "info");
    // Remove all possible interactions
    for (id of ["purchase", "building", "movement", "payment", "tax", "action", "continue"]) {
      interactions.removeByProperty("id", id);
    }
    game.currentAction = null;

    if (movement.next.purchase) {
      var purchaseInteraction = interactions.add({
        description: "Buy " + targetSymbol +  " " + movement.target.name + " ?",
        keys: ["b"],
        id: "purchase",
        type: "secondary",
        callback() {
          //interactions.remove(purchaseInteraction);
          current.team.buy(movement.target);
          // Change purchase interaction text to success of purchase
          purchaseInteraction.appendProperties({
            description: "You bought " + movement.target.name + " successfully!",
            keys: []
          });
          game.emit("change");
        }
      });
    }
    if (movement.next.building) {
      const newLevel = movement.target.level + 1;
      const buildingSymbol = newLevel < 5 ? buildingSymbols.normal.repeat(newLevel) : newLevel ? buildingSymbols.hotel : "";
      var purchaseInteraction = interactions.add({
        description: "Building " + buildingSymbol + " ?",
        keys: ["b"],
        id: "building",
        type: "secondary",
        callback() {
          //interactions.remove(purchaseInteraction);
          movement.target.level++;
          // Change purchase interaction text to success of purchase
          purchaseInteraction.appendProperties({
            description: "You builded " + buildingSymbol + " successfully!",
            keys: []
          });
          game.emit("change");
        }
      });
    }

    if (movement.next.payment) {
      var paymentInteraction = interactions.add({
        description: "You landed on Team " + (movement.target.owner.index + 1) + "'s " + (pieceSymbols[movement.target.owner.index]) + " field. You have to pay $" + movement.next.payment.amount,
        keys: [],
        id: "payment",
        type: "secondary",
        callback() {}
      });
    }

    if (movement.next.tax) {
      var taxInteraction = interactions.add({
        description: movement.next.tax > 0 ? ("You have to pay an amount of $" + movement.next.tax + " as tax") : ("You earned $" + -movement.next.tax + " as bonus money!"),
        keys: [],
        id: "tax",
        type: "secondary",
        callback() {}
      });
    }

    if (movement.next.action) {
      var actionInteraction = interactions.add({
        description: "Action: " + movement.next.action.action.message,
        keys: [],
        id: "action",
        type: "secondary",
        callback() {}
      });
    }

    if (movement.next.movement) {
      var movementInteraction = interactions.add({
        description: "You have to go to \"" + movement.next.movement.name + '"',
        keys: [],
        id: "movement",
        type: "secondary",
        callback() {}
      });
    }

    game.currentAction = movement.next.action;
    game.emit("change");

    var continuteInteractionText = interactions.add({
      description: "Continue ?",
      keys: ["return"],
      id: "continue",
      type: "primary",
      async callback() {
        // Remove interaction text's
        interactions.remove(paymentInteraction, interactionText, purchaseInteraction, taxInteraction, actionInteraction);
        // If there exist an open payment, proceed it
        if (movement.next.payment) {
          current.team.transaction(movement.target.owner, movement.next.payment.amount);
        }
        // If there exist an open tax payment, proceed it
        if (movement.next.tax) {
          current.team.payTax(movement.next.tax);
        }

        if (movement.next.movement) {
          current.team.moveTo(movement.next.movement);
          movementInteraction.appendProperties({
            description: teamNameWithIcon + " moved to \"" + movement.next.movement.name + (current.team.jail ? " (Suspended from next round)" : ""),
            keys: []
          });
        }

        var waitingForNextMove = false;


        if (movement.next.action) {
          const actionResult = game.action(movement.next.action.action, current.team);
          // If the result has a 'next' info
          if (actionResult && "next" in actionResult) {
            waitingForNextMove = true;
            await handleMovement(actionResult, actionInteraction);
          }
        }
        // If there is no move to wait for (anymore), go to next team
        if (!waitingForNextMove) {
          //interactions.removeByProperty("id", "info");
          //current.team = game.teams[(current.team.index + 1) % game.teams.length];
        }
        interactions.remove(continuteInteractionText);

        if (!waitingForNextMove) {
          current.team = game.teams[(current.team.index + 1) % game.teams.length];
          interactions.removeByProperty("id", "info");
          move();

        }

        resolve(true);

        game.emit("change");

      }
    });

    game.emit("change");
  });
}
