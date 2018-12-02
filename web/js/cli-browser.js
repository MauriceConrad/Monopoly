(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
class Team {
  constructor(game, index, wallet = 0) {
    this.game = game;
    this.index = index;
    this.wallet = wallet;
  }
  move(steps = 0) {
    this.piece.position += steps;
    // If team passed START
    if (this.piece.position >= this.game.board.map.length) {
      this.earnSalary();
    }
    // Get position relative to board
    this.piece.position = this.piece.position % this.game.board.map.length;
    const enteredField = this.game.board.map[this.piece.position];
    // Get te object liertal of next actions returned from the 'enter' method within the enteredField
    // nextActions contains all actions that should be performed next
    // Generally the object gets returned here but also handled by te 'nextActions' method of the game instance that fires separate events
    const nextActions = "enter" in enteredField ? enteredField.enter(this, {
      steps: steps
    }) : {};
    this.game.nextActions(nextActions);
    this.game.emit("change");
    return {
      success: true,
      steps: steps,
      team: this,
      target: enteredField,
      next: nextActions
    };

    this.jail = false;
  }
  moveTo(target) {
    return this.move(target.index - this.piece.position);
  }
  buy(field, rules = true) {
    // If the current team's piece is standing on the field we want to buy (otherwise we are not allowed to do this)
    if (this.piece.position === field.index || !rules) {
      field.owner = this;
      this.wallet -= field.price;
      this.game.emit("change");
    }
    else {
      throw new Error("Not allowed to buy this field");
    }
  }
  transaction(targetTeam, amount) {
    targetTeam.wallet += amount;
    this.wallet -= amount;
    this.game.emit("change");
  }
  payTax(amount) {
    this.wallet -= amount;
    this.game.emit("change");
  }
  earnSalary() {
    this.wallet += 200;
  }
  get fields() {
    // Filter for all field's on the board whose owner is me (this)
    return this.game.board.map.filter(field => field.owner == this);
  }
  get collections() {

  }
  get piece() {
    return this.game.board.pieces[this.index];
  }
  get name() {
    return "Team " + (this.index + 1);
  }
}
module.exports = Team;

},{}],2:[function(require,module,exports){
(function (process){
var readline = require('readline');

if (!("Interface" in readline)) {
  readline = require("./readline-browser-polyfill");
  console.log(readline);
}

module.exports = class Interactions {
  constructor() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {

      if (key.ctrl && key.name === 'c') {
        //process.exit();
      }
      else {
        const emittedInteraction = (() => {
          for (let interaction of this.list) {
            if (interaction.keys.includes(key.name)) {
              return interaction;
            }
          }
        })();
        if (emittedInteraction) {
          emittedInteraction.callback(key);
        }
      }
    });

    this.list = [];

  }
  add(interaction) {
    const newInteraction = new Interaction(interaction);
    this.list.push(newInteraction);
    return newInteraction;
  }
  /*remove(interactionObj) {
    this.list = this.list.filter(interaction => interaction != interactionObj);

  }*/
  remove(...interactionsRemove) {
    this.list = this.list.filter(interaction => !interactionsRemove.includes(interaction));
  }
  removeByProperty(propertyName, value, multiple = false) {
    this.list = this.list.filter(interaction => interaction[propertyName] != value);
  }
};

class Interaction {
  constructor(interactionProto) {
    this.appendProperties(interactionProto);
  }
  get text() {
    return this.description + " " + this.keys.map(keyName => "[" + keyName.toUpperCase() + "]").join(" ");
  }
  appendProperties(interactionProto) {
    for (let propName in interactionProto) {
      if (interactionProto.hasOwnProperty(propName)) {
        this[propName] = interactionProto[propName];
      }
    }
  }
}

}).call(this,require('_process'))
},{"./readline-browser-polyfill":18,"_process":38,"readline":36}],3:[function(require,module,exports){
(function (process){
const Monopoly = require("../");
const render = require('./render/text');
const commandLineArgs = require('command-line-args');

const Interactions = require('./Interactions');

var readline = require('readline');

if (!("Interface" in readline)) {
  readline = require("./readline-browser-polyfill");
  console.log(readline);
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
  teams: 6
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



const pieceSymbols = ["🚎", "🐕", "🗿", "🚀", "🦄"];
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

}).call(this,require('_process'))
},{"../":22,"./Interactions":2,"./readline-browser-polyfill":18,"./render/text":20,"_process":38,"command-line-args":6,"readline":36}],4:[function(require,module,exports){
(function (process){
'use strict'

/**
 * Some useful tools for working with `process.argv`.
 *
 * @module argv-tools
 * @typicalName argvTools
 * @example
 * const argvTools = require('argv-tools')
 */

/**
 * Regular expressions for matching option formats.
 * @static
 */
const re = {
  short: /^-([^\d-])$/,
  long: /^--(\S+)/,
  combinedShort: /^-[^\d-]{2,}$/,
  optEquals: /^(--\S+?)=(.*)/
}

/**
 * Array subclass encapsulating common operations on `process.argv`.
 * @static
 */
class ArgvArray extends Array {
  /**
   * Clears the array has loads the supplied input.
   * @param {string[]} argv - The argv list to load. Defaults to `process.argv`.
   */
  load (argv) {
    const arrayify = require('array-back')
    this.clear()
    if (argv && argv !== process.argv) {
      argv = arrayify(argv)
    } else {
      /* if no argv supplied, assume we are parsing process.argv */
      argv = process.argv.slice(0)
      argv.splice(0, 2)
    }
    argv.forEach(arg => this.push(String(arg)))
  }

  /**
   * Clear the array.
   */
  clear () {
    this.length = 0
  }

  /**
   * expand ``--option=value` style args.
   */
  expandOptionEqualsNotation () {
    if (this.some(arg => re.optEquals.test(arg))) {
      const expandedArgs = []
      this.forEach(arg => {
        const matches = arg.match(re.optEquals)
        if (matches) {
          expandedArgs.push(matches[1], matches[2])
        } else {
          expandedArgs.push(arg)
        }
      })
      this.clear()
      this.load(expandedArgs)
    }
  }

  /**
   * expand getopt-style combinedShort options.
   */
  expandGetoptNotation () {
    if (this.hasCombinedShortOptions()) {
      const findReplace = require('find-replace')
      findReplace(this, re.combinedShort, expandCombinedShortArg)
    }
  }

  /**
   * Returns true if the array contains combined short options (e.g. `-ab`).
   * @returns {boolean}
   */
  hasCombinedShortOptions () {
    return this.some(arg => re.combinedShort.test(arg))
  }

  static from (argv) {
    const result = new this()
    result.load(argv)
    return result
  }
}

/**
 * Expand a combined short option.
 * @param {string} - the string to expand, e.g. `-ab`
 * @returns {string[]}
 * @static
 */
function expandCombinedShortArg (arg) {
  /* remove initial hypen */
  arg = arg.slice(1)
  return arg.split('').map(letter => '-' + letter)
}

/**
 * Returns true if the supplied arg matches `--option=value` notation.
 * @param {string} - the arg to test, e.g. `--one=something`
 * @returns {boolean}
 * @static
 */
function isOptionEqualsNotation (arg) {
  return re.optEquals.test(arg)
}

/**
 * Returns true if the supplied arg is in either long (`--one`) or short (`-o`) format.
 * @param {string} - the arg to test, e.g. `--one`
 * @returns {boolean}
 * @static
 */
function isOption (arg) {
  return (re.short.test(arg) || re.long.test(arg)) && !re.optEquals.test(arg)
}

/**
 * Returns true if the supplied arg is in long (`--one`) format.
 * @param {string} - the arg to test, e.g. `--one`
 * @returns {boolean}
 * @static
 */
function isLongOption (arg) {
  return re.long.test(arg) && !isOptionEqualsNotation(arg)
}

/**
 * Returns the name from a long, short or `--options=value` arg.
 * @param {string} - the arg to inspect, e.g. `--one`
 * @returns {string}
 * @static
 */
function getOptionName (arg) {
  if (re.short.test(arg)) {
    return arg.match(re.short)[1]
  } else if (isLongOption(arg)) {
    return arg.match(re.long)[1]
  } else if (isOptionEqualsNotation(arg)) {
    return arg.match(re.optEquals)[1].replace(/^--/, '')
  } else {
    return null
  }
}

exports.expandCombinedShortArg = expandCombinedShortArg
exports.re = re
exports.ArgvArray = ArgvArray
exports.getOptionName = getOptionName
exports.isOption = isOption
exports.isLongOption = isLongOption
exports.isOptionEqualsNotation = isOptionEqualsNotation
exports.isValue = arg => !(isOption(arg) || re.combinedShort.test(arg) || re.optEquals.test(arg))

}).call(this,require('_process'))
},{"_process":38,"array-back":5,"find-replace":14}],5:[function(require,module,exports){
/**
 * @module array-back
 * @example
 * const arrayify = require('array-back')
 */
module.exports = arrayify

/**
 * Takes any input and guarantees an array back.
 *
 * - converts array-like objects (e.g. `arguments`) to a real array
 * - converts `undefined` to an empty array
 * - converts any another other, singular value (including `null`) into an array containing that value
 * - ignores input which is already an array
 *
 * @param {*} - the input value to convert to an array
 * @returns {Array}
 * @alias module:array-back
 * @example
 * > a.arrayify(undefined)
 * []
 *
 * > a.arrayify(null)
 * [ null ]
 *
 * > a.arrayify(0)
 * [ 0 ]
 *
 * > a.arrayify([ 1, 2 ])
 * [ 1, 2 ]
 *
 * > function f(){ return a.arrayify(arguments); }
 * > f(1,2,3)
 * [ 1, 2, 3 ]
 */
function arrayify (input) {
  const t = require('typical')
  if (Array.isArray(input)) {
    return input
  } else {
    if (input === undefined) {
      return []
    } else if (t.isArrayLike(input)) {
      return Array.prototype.slice.call(input)
    } else {
      return [ input ]
    }
  }
}

},{"typical":17}],6:[function(require,module,exports){
'use strict'

/**
 * @module command-line-args
 */
module.exports = commandLineArgs

/**
 * Returns an object containing all option values set on the command line. By default it parses the global  [`process.argv`](https://nodejs.org/api/process.html#process_process_argv) array.
 *
 * Parsing is strict by default - an exception is thrown if the user sets a singular option more than once or sets an unknown value or option (one without a valid [definition](https://github.com/75lb/command-line-args/blob/master/doc/option-definition.md)). To be more permissive, enabling [partial](https://github.com/75lb/command-line-args/wiki/Partial-mode-example) or [stopAtFirstUnknown](https://github.com/75lb/command-line-args/wiki/stopAtFirstUnknown) modes will return known options in the usual manner while collecting unknown arguments in a separate `_unknown` property.
 *
 * @param {module:definition[]} - An array of [OptionDefinition](https://github.com/75lb/command-line-args/blob/master/doc/option-definition.md) objects
 * @param {object} [options] - Options.
 * @param {string[]} [options.argv] - An array of strings which, if present will be parsed instead  of `process.argv`.
 * @param {boolean} [options.partial] - If `true`, an array of unknown arguments is returned in the `_unknown` property of the output.
 * @param {boolean} [options.stopAtFirstUnknown] - If `true`, parsing will stop at the first unknown argument and the remaining arguments returned in `_unknown`. When set, `partial: true` is also implied.
 * @param {boolean} [options.camelCase] - If `true`, options with hypenated names (e.g. `move-to`) will be returned in camel-case (e.g. `moveTo`).
 * @returns {object}
 * @throws `UNKNOWN_OPTION` If `options.partial` is false and the user set an undefined option. The `err.optionName` property contains the arg that specified an unknown option, e.g. `--one`.
 * @throws `UNKNOWN_VALUE` If `options.partial` is false and the user set a value unaccounted for by an option definition. The `err.value` property contains the unknown value, e.g. `5`.
 * @throws `ALREADY_SET` If a user sets a singular, non-multiple option more than once. The `err.optionName` property contains the option name that has already been set, e.g. `one`.
 * @throws `INVALID_DEFINITIONS`
 *   - If an option definition is missing the required `name` property
 *   - If an option definition has a `type` value that's not a function
 *   - If an alias is numeric, a hyphen or a length other than 1
 *   - If an option definition name was used more than once
 *   - If an option definition alias was used more than once
 *   - If more than one option definition has `defaultOption: true`
 *   - If a `Boolean` option is also set as the `defaultOption`.
 * @alias module:command-line-args
 */
function commandLineArgs (optionDefinitions, options) {
  options = options || {}
  if (options.stopAtFirstUnknown) options.partial = true
  const Definitions = require('./lib/option-definitions')
  optionDefinitions = Definitions.from(optionDefinitions)

  const ArgvParser = require('./lib/argv-parser')
  const parser = new ArgvParser(optionDefinitions, {
    argv: options.argv,
    stopAtFirstUnknown: options.stopAtFirstUnknown
  })

  const Option = require('./lib/option')
  const OutputClass = optionDefinitions.isGrouped() ? require('./lib/output-grouped') : require('./lib/output')
  const output = new OutputClass(optionDefinitions)

  /* Iterate the parser setting each known value to the output. Optionally, throw on unknowns. */
  for (const argInfo of parser) {
    const arg = argInfo.subArg || argInfo.arg
    if (!options.partial) {
      if (argInfo.event === 'unknown_value') {
        const err = new Error(`Unknown value: ${arg}`)
        err.name = 'UNKNOWN_VALUE'
        err.value = arg
        throw err
      } else if (argInfo.event === 'unknown_option') {
        const err = new Error(`Unknown option: ${arg}`)
        err.name = 'UNKNOWN_OPTION'
        err.optionName = arg
        throw err
      }
    }

    let option
    if (output.has(argInfo.name)) {
      option = output.get(argInfo.name)
    } else {
      option = Option.create(argInfo.def)
      output.set(argInfo.name, option)
    }

    if (argInfo.name === '_unknown') {
      option.set(arg)
    } else {
      option.set(argInfo.value)
    }
  }

  return output.toObject({ skipUnknown: !options.partial, camelCase: options.camelCase })
}

},{"./lib/argv-parser":7,"./lib/option":11,"./lib/option-definitions":9,"./lib/output":13,"./lib/output-grouped":12}],7:[function(require,module,exports){
'use strict'
const argvTools = require('argv-tools')

/**
 * @module argv-parser
 */

/**
 * @alias module:argv-parser
 */
class ArgvParser {
  /**
   * @param {OptionDefinitions} - Definitions array
   * @param {object} [options] - Options
   * @param {string[]} [options.argv] - Overrides `process.argv`
   * @param {boolean} [options.stopAtFirstUnknown] -
   */
  constructor (definitions, options) {
    this.options = Object.assign({}, options)
    const Definitions = require('./option-definitions')
    /**
     * Option Definitions
     */
    this.definitions = Definitions.from(definitions)

    /**
     * Argv
     */
    this.argv = argvTools.ArgvArray.from(this.options.argv)
    if (this.argv.hasCombinedShortOptions()) {
      const findReplace = require('find-replace')
      findReplace(this.argv, argvTools.re.combinedShort, arg => {
        arg = arg.slice(1)
        return arg.split('').map(letter => ({ origArg: `-${arg}`, arg: '-' + letter }))
      })
    }
  }

  /**
   * Yields one `{ event, name, value, arg, def }` argInfo object for each arg in `process.argv` (or `options.argv`).
   */
  * [Symbol.iterator] () {
    const definitions = this.definitions
    const t = require('typical')

    let def
    let value
    let name
    let event
    let singularDefaultSet = false
    let unknownFound = false
    let origArg

    for (let arg of this.argv) {
      if (t.isPlainObject(arg)) {
        origArg = arg.origArg
        arg = arg.arg
      }

      if (unknownFound && this.options.stopAtFirstUnknown) {
        yield { event: 'unknown_value', arg, name: '_unknown', value: undefined }
        continue
      }

      /* handle long or short option */
      if (argvTools.isOption(arg)) {
        def = definitions.get(arg)
        value = undefined
        if (def) {
          value = def.isBoolean() ? true : null
          event = 'set'
        } else {
          event = 'unknown_option'
        }

      /* handle --option-value notation */
    } else if (argvTools.isOptionEqualsNotation(arg)) {
        const matches = arg.match(argvTools.re.optEquals)
        def = definitions.get(matches[1])
        if (def) {
          if (def.isBoolean()) {
            yield { event: 'unknown_value', arg, name: '_unknown', value, def }
            event = 'set'
            value = true
          } else {
            event = 'set'
            value = matches[2]
          }
        } else {
          event = 'unknown_option'
        }

      /* handle value */
    } else if (argvTools.isValue(arg)) {
        if (def) {
          value = arg
          event = 'set'
        } else {
          /* get the defaultOption */
          def = this.definitions.getDefault()
          if (def && !singularDefaultSet) {
            value = arg
            event = 'set'
          } else {
            event = 'unknown_value'
            def = undefined
          }
        }
      }

      name = def ? def.name : '_unknown'
      const argInfo = { event, arg, name, value, def }
      if (origArg) {
        argInfo.subArg = arg
        argInfo.arg = origArg
      }
      yield argInfo

      /* unknownFound logic */
      if (name === '_unknown') unknownFound = true

      /* singularDefaultSet logic */
      if (def && def.defaultOption && !def.isMultiple() && event === 'set') singularDefaultSet = true

      /* reset values once consumed and yielded */
      if (def && def.isBoolean()) def = undefined
      /* reset the def if it's a singular which has been set */
      if (def && !def.multiple && t.isDefined(value) && value !== null) {
        def = undefined
      }
      value = undefined
      event = undefined
      name = undefined
      origArg = undefined
    }
  }
}

module.exports = ArgvParser

},{"./option-definitions":9,"argv-tools":4,"find-replace":14,"typical":17}],8:[function(require,module,exports){
'use strict'
const t = require('typical')

/**
 * @module option-definition
 */

/**
 * Describes a command-line option. Additionally, if generating a usage guide with [command-line-usage](https://github.com/75lb/command-line-usage) you could optionally add `description` and `typeLabel` properties to each definition.
 *
 * @alias module:option-definition
 * @typicalname option
 */
class OptionDefinition {
  constructor (definition) {
    /**
    * The only required definition property is `name`, so the simplest working example is
    * ```js
    * const optionDefinitions = [
    *   { name: 'file' },
    *   { name: 'depth' }
    * ]
    * ```
    *
    * Where a `type` property is not specified it will default to `String`.
    *
    * | #   | Command line args | .parse() output |
    * | --- | -------------------- | ------------ |
    * | 1   | `--file` | `{ file: null }` |
    * | 2   | `--file lib.js` | `{ file: 'lib.js' }` |
    * | 3   | `--depth 2` | `{ depth: '2' }` |
    *
    * Unicode option names and aliases are valid, for example:
    * ```js
    * const optionDefinitions = [
    *   { name: 'один' },
    *   { name: '两' },
    *   { name: 'три', alias: 'т' }
    * ]
    * ```
    * @type {string}
    */
    this.name = definition.name

    /**
    * The `type` value is a setter function (you receive the output from this), enabling you to be specific about the type and value received.
    *
    * The most common values used are `String` (the default), `Number` and `Boolean` but you can use a custom function, for example:
    *
    * ```js
    * const fs = require('fs')
    *
    * class FileDetails {
    *   constructor (filename) {
    *     this.filename = filename
    *     this.exists = fs.existsSync(filename)
    *   }
    * }
    *
    * const cli = commandLineArgs([
    *   { name: 'file', type: filename => new FileDetails(filename) },
    *   { name: 'depth', type: Number }
    * ])
    * ```
    *
    * | #   | Command line args| .parse() output |
    * | --- | ----------------- | ------------ |
    * | 1   | `--file asdf.txt` | `{ file: { filename: 'asdf.txt', exists: false } }` |
    *
    * The `--depth` option expects a `Number`. If no value was set, you will receive `null`.
    *
    * | #   | Command line args | .parse() output |
    * | --- | ----------------- | ------------ |
    * | 2   | `--depth` | `{ depth: null }` |
    * | 3   | `--depth 2` | `{ depth: 2 }` |
    *
    * @type {function}
    * @default String
    */
    this.type = definition.type || String

    /**
    * getopt-style short option names. Can be any single character (unicode included) except a digit or hyphen.
    *
    * ```js
    * const optionDefinitions = [
    *   { name: 'hot', alias: 'h', type: Boolean },
    *   { name: 'discount', alias: 'd', type: Boolean },
    *   { name: 'courses', alias: 'c' , type: Number }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `-hcd` | `{ hot: true, courses: null, discount: true }` |
    * | 2   | `-hdc 3` | `{ hot: true, discount: true, courses: 3 }` |
    *
    * @type {string}
    */
    this.alias = definition.alias

    /**
    * Set this flag if the option takes a list of values. You will receive an array of values, each passed through the `type` function (if specified).
    *
    * ```js
    * const optionDefinitions = [
    *   { name: 'files', type: String, multiple: true }
    * ]
    * ```
    *
    * Note, examples 1 and 3 below demonstrate "greedy" parsing which can be disabled by using `lazyMultiple`.
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `--files one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 2   | `--files one.js --files two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 3   | `--files *` | `{ files: [ 'one.js', 'two.js' ] }` |
    *
    * @type {boolean}
    */
    this.multiple = definition.multiple

    /**
     * Identical to `multiple` but with greedy parsing disabled.
     *
     * ```js
     * const optionDefinitions = [
     *   { name: 'files', lazyMultiple: true },
     *   { name: 'verbose', alias: 'v', type: Boolean, lazyMultiple: true }
     * ]
     * ```
     *
     * | #   | Command line | .parse() output |
     * | --- | ------------ | ------------ |
     * | 1   | `--files one.js --files two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
     * | 2   | `-vvv` | `{ verbose: [ true, true, true ] }` |
     *
     * @type {boolean}
     */
    this.lazyMultiple = definition.lazyMultiple

    /**
    * Any values unaccounted for by an option definition will be set on the `defaultOption`. This flag is typically set on the most commonly-used option to make for more concise usage (i.e. `$ example *.js` instead of `$ example --files *.js`).
    *
    * ```js
    * const optionDefinitions = [
    *   { name: 'files', multiple: true, defaultOption: true }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `--files one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 2   | `one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 3   | `*` | `{ files: [ 'one.js', 'two.js' ] }` |
    *
    * @type {boolean}
    */
    this.defaultOption = definition.defaultOption

    /**
    * An initial value for the option.
    *
    * ```js
    * const optionDefinitions = [
    *   { name: 'files', multiple: true, defaultValue: [ 'one.js' ] },
    *   { name: 'max', type: Number, defaultValue: 3 }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   |  | `{ files: [ 'one.js' ], max: 3 }` |
    * | 2   | `--files two.js` | `{ files: [ 'two.js' ], max: 3 }` |
    * | 3   | `--max 4` | `{ files: [ 'one.js' ], max: 4 }` |
    *
    * @type {*}
    */
    this.defaultValue = definition.defaultValue

    /**
    * When your app has a large amount of options it makes sense to organise them in groups.
    *
    * There are two automatic groups: `_all` (contains all options) and `_none` (contains options without a `group` specified in their definition).
    *
    * ```js
    * const optionDefinitions = [
    *   { name: 'verbose', group: 'standard' },
    *   { name: 'help', group: [ 'standard', 'main' ] },
    *   { name: 'compress', group: [ 'server', 'main' ] },
    *   { name: 'static', group: 'server' },
    *   { name: 'debug' }
    * ]
    * ```
    *
    *<table>
    *  <tr>
    *    <th>#</th><th>Command Line</th><th>.parse() output</th>
    *  </tr>
    *  <tr>
    *    <td>1</td><td><code>--verbose</code></td><td><pre><code>
    *{
    *  _all: { verbose: true },
    *  standard: { verbose: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>2</td><td><code>--debug</code></td><td><pre><code>
    *{
    *  _all: { debug: true },
    *  _none: { debug: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>3</td><td><code>--verbose --debug --compress</code></td><td><pre><code>
    *{
    *  _all: {
    *    verbose: true,
    *    debug: true,
    *    compress: true
    *  },
    *  standard: { verbose: true },
    *  server: { compress: true },
    *  main: { compress: true },
    *  _none: { debug: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>4</td><td><code>--compress</code></td><td><pre><code>
    *{
    *  _all: { compress: true },
    *  server: { compress: true },
    *  main: { compress: true }
    *}
    *</code></pre></td>
    *  </tr>
    *</table>
    *
    * @type {string|string[]}
    */
    this.group = definition.group

    /* pick up any remaining properties */
    for (let prop in definition) {
      if (!this[prop]) this[prop] = definition[prop]
    }
  }

  isBoolean () {
    return this.type === Boolean || (t.isFunction(this.type) && this.type.name === 'Boolean')
  }
  isMultiple () {
    return this.multiple || this.lazyMultiple
  }

  static create (def) {
    const result = new this(def)
    return result
  }
}

module.exports = OptionDefinition

},{"typical":17}],9:[function(require,module,exports){
'use strict'
const arrayify = require('array-back')
const argvTools = require('argv-tools')
const t = require('typical')

/**
 * @module option-definitions
 */

/**
 * @alias module:option-definitions
 */
class Definitions extends Array {
  /**
   * validate option definitions
   * @returns {string}
   */
  validate () {
    const someHaveNoName = this.some(def => !def.name)
    if (someHaveNoName) {
      halt(
        'INVALID_DEFINITIONS',
        'Invalid option definitions: the `name` property is required on each definition'
      )
    }

    const someDontHaveFunctionType = this.some(def => def.type && typeof def.type !== 'function')
    if (someDontHaveFunctionType) {
      halt(
        'INVALID_DEFINITIONS',
        'Invalid option definitions: the `type` property must be a setter fuction (default: `Boolean`)'
      )
    }

    let invalidOption

    const numericAlias = this.some(def => {
      invalidOption = def
      return t.isDefined(def.alias) && t.isNumber(def.alias)
    })
    if (numericAlias) {
      halt(
        'INVALID_DEFINITIONS',
        'Invalid option definition: to avoid ambiguity an alias cannot be numeric [--' + invalidOption.name + ' alias is -' + invalidOption.alias + ']'
      )
    }

    const multiCharacterAlias = this.some(def => {
      invalidOption = def
      return t.isDefined(def.alias) && def.alias.length !== 1
    })
    if (multiCharacterAlias) {
      halt(
        'INVALID_DEFINITIONS',
        'Invalid option definition: an alias must be a single character'
      )
    }

    const hypenAlias = this.some(def => {
      invalidOption = def
      return def.alias === '-'
    })
    if (hypenAlias) {
      halt(
        'INVALID_DEFINITIONS',
        'Invalid option definition: an alias cannot be "-"'
      )
    }

    const duplicateName = hasDuplicates(this.map(def => def.name))
    if (duplicateName) {
      halt(
        'INVALID_DEFINITIONS',
        'Two or more option definitions have the same name'
      )
    }

    const duplicateAlias = hasDuplicates(this.map(def => def.alias))
    if (duplicateAlias) {
      halt(
        'INVALID_DEFINITIONS',
        'Two or more option definitions have the same alias'
      )
    }

    const duplicateDefaultOption = hasDuplicates(this.map(def => def.defaultOption))
    if (duplicateDefaultOption) {
      halt(
        'INVALID_DEFINITIONS',
        'Only one option definition can be the defaultOption'
      )
    }

    const defaultBoolean = this.some(def => {
      invalidOption = def
      return def.isBoolean() && def.defaultOption
    })
    if (defaultBoolean) {
      halt(
        'INVALID_DEFINITIONS',
        `A boolean option ["${invalidOption.name}"] can not also be the defaultOption.`
      )
    }
  }

  /**
   * Get definition by option arg (e.g. `--one` or `-o`)
   * @param {string}
   * @returns {Definition}
   */
  get (arg) {
    if (argvTools.isOption(arg)) {
      return argvTools.re.short.test(arg)
        ? this.find(def => def.alias === argvTools.getOptionName(arg))
        : this.find(def => def.name === argvTools.getOptionName(arg))
    } else {
      return this.find(def => def.name === arg)
    }
  }

  getDefault () {
    return this.find(def => def.defaultOption === true)
  }

  isGrouped () {
    return this.some(def => def.group)
  }

  whereGrouped () {
    return this.filter(containsValidGroup)
  }
  whereNotGrouped () {
    return this.filter(def => !containsValidGroup(def))
  }
  whereDefaultValueSet () {
    return this.filter(def => t.isDefined(def.defaultValue))
  }

  static from (definitions) {
    if (definitions instanceof this) return definitions
    const Definition = require('./option-definition')
    const result = super.from(arrayify(definitions), def => Definition.create(def))
    result.validate()
    return result
  }
}

function halt (name, message) {
  const err = new Error(message)
  err.name = name
  throw err
}

function containsValidGroup (def) {
  return arrayify(def.group).some(group => group)
}

function hasDuplicates (array) {
  const items = {}
  for (let i = 0; i < array.length; i++) {
    const value = array[i]
    if (items[value]) {
      return true
    } else {
      if (t.isDefined(value)) items[value] = true
    }
  }
}

module.exports = Definitions

},{"./option-definition":8,"argv-tools":4,"array-back":5,"typical":17}],10:[function(require,module,exports){
'use strict'
const Option = require('./option')

class FlagOption extends Option {
  set (val) {
    super.set(true)
  }

  static create (def) {
    return new this(def)
  }
}

module.exports = FlagOption

},{"./option":11}],11:[function(require,module,exports){
'use strict'
const _value = new WeakMap()
const arrayify = require('array-back')
const t = require('typical')
const Definition = require('./option-definition')

/**
 * Encapsulates behaviour (defined by an OptionDefinition) when setting values
 */
class Option {
  constructor (definition) {
    this.definition = new Definition(definition)
    this.state = null /* set or default */
    this.resetToDefault()
  }

  get () {
    return _value.get(this)
  }

  set (val) {
    this._set(val, 'set')
  }

  _set (val, state) {
    const def = this.definition
    if (def.isMultiple()) {
      /* don't add null or undefined to a multiple */
      if (val !== null && val !== undefined) {
        const arr = this.get()
        if (this.state === 'default') arr.length = 0
        arr.push(def.type(val))
        this.state = state
      }
    } else {
      /* throw if already set on a singlar defaultOption */
      if (!def.isMultiple() && this.state === 'set') {
        const err = new Error(`Singular option already set [${this.definition.name}=${this.get()}]`)
        err.name = 'ALREADY_SET'
        err.value = val
        err.optionName = def.name
        throw err
      } else if (val === null || val === undefined) {
        _value.set(this, val)
        // /* required to make 'partial: defaultOption with value equal to defaultValue 2' pass */
        // if (!(def.defaultOption && !def.isMultiple())) {
        //   this.state = state
        // }
      } else {
        _value.set(this, def.type(val))
        this.state = state
      }
    }
  }

  resetToDefault () {
    if (t.isDefined(this.definition.defaultValue)) {
      if (this.definition.isMultiple()) {
        _value.set(this, arrayify(this.definition.defaultValue).slice())
      } else {
        _value.set(this, this.definition.defaultValue)
      }
    } else {
      if (this.definition.isMultiple()) {
        _value.set(this, [])
      } else {
        _value.set(this, null)
      }
    }
    this.state = 'default'
  }

  static create (definition) {
    definition = new Definition(definition)
    if (definition.isBoolean()) {
      return require('./option-flag').create(definition)
    } else {
      return new this(definition)
    }
  }
}

module.exports = Option

},{"./option-definition":8,"./option-flag":10,"array-back":5,"typical":17}],12:[function(require,module,exports){
'use strict'
const Output = require('./output')

class GroupedOutput extends Output {
  toObject (options) {
    const arrayify = require('array-back')
    const t = require('typical')
    const camelCase = require('lodash.camelcase')
    const superOutputNoCamel = super.toObject({ skipUnknown: options.skipUnknown })
    const superOutput = super.toObject(options)
    const unknown = superOutput._unknown
    delete superOutput._unknown
    const grouped = {
      _all: superOutput
    }
    if (unknown && unknown.length) grouped._unknown = unknown

    this.definitions.whereGrouped().forEach(def => {
      const name = options.camelCase ? camelCase(def.name) : def.name
      const outputValue = superOutputNoCamel[def.name]
      for (const groupName of arrayify(def.group)) {
        grouped[groupName] = grouped[groupName] || {}
        if (t.isDefined(outputValue)) {
          grouped[groupName][name] = outputValue
        }
      }
    })

    this.definitions.whereNotGrouped().forEach(def => {
      const name = options.camelCase ? camelCase(def.name) : def.name
      const outputValue = superOutputNoCamel[def.name]
      if (t.isDefined(outputValue)) {
        if (!grouped._none) grouped._none = {}
        grouped._none[name] = outputValue
      }
    })
    return grouped
  }
}

module.exports = GroupedOutput

},{"./output":13,"array-back":5,"lodash.camelcase":15,"typical":17}],13:[function(require,module,exports){
'use strict'
const Option = require('./option')

/**
 * A map of { DefinitionNameString: Option }. By default, an Output has an `_unknown` property and any options with defaultValues.
 */
class Output extends Map {
  constructor (definitions) {
    super()
    const Definitions = require('./option-definitions')
    /**
     * @type {OptionDefinitions}
     */
    this.definitions = Definitions.from(definitions)

    /* by default, an Output has an `_unknown` property and any options with defaultValues */
    this.set('_unknown', Option.create({ name: '_unknown', multiple: true }))
    for (const def of this.definitions.whereDefaultValueSet()) {
      this.set(def.name, Option.create(def))
    }
  }

  toObject (options) {
    const camelCase = require('lodash.camelcase')
    options = options || {}
    const output = {}
    for (const item of this) {
      const name = options.camelCase && item[0] !== '_unknown' ? camelCase(item[0]) : item[0]
      const option = item[1]
      if (name === '_unknown' && !option.get().length) continue
      output[name] = option.get()
    }

    if (options.skipUnknown) delete output._unknown
    return output
  }
}

module.exports = Output

},{"./option":11,"./option-definitions":9,"lodash.camelcase":15}],14:[function(require,module,exports){
'use strict'
const arrayify = require('array-back')
const testValue = require('test-value')

/**
 * Find and either replace or remove items from an array.
 *
 * @module find-replace
 * @example
 * > findReplace = require('find-replace')
 *
 * > findReplace([ 1, 2, 3], 2, 'two')
 * [ 1, 'two', 3 ]
 *
 * > findReplace([ 1, 2, 3], 2, [ 'two', 'zwei' ])
 * [ 1, [ 'two', 'zwei' ], 3 ]
 *
 * > findReplace([ 1, 2, 3], 2, 'two', 'zwei')
 * [ 1, 'two', 'zwei', 3 ]
 *
 * > findReplace([ 1, 2, 3], 2) // no replacement, so remove
 * [ 1, 3 ]
 */
module.exports = findReplace

/**
 * @param {array} - the input array
 * @param {valueTest} - a [test-value](https://github.com/75lb/test-value) query to match the value you're looking for
 * @param [replaceWith] {...any} - If specified, found values will be replaced with these values, else  removed.
 * @returns {array}
 * @alias module:find-replace
 */
function findReplace (array, valueTest) {
  const found = []
  const replaceWiths = arrayify(arguments)
  replaceWiths.splice(0, 2)

  arrayify(array).forEach((value, index) => {
    let expanded = []
    replaceWiths.forEach(replaceWith => {
      if (typeof replaceWith === 'function') {
        expanded = expanded.concat(replaceWith(value))
      } else {
        expanded.push(replaceWith)
      }
    })

    if (testValue(value, valueTest)) {
      found.push({
        index: index,
        replaceWithValue: expanded
      })
    }
  })

  found.reverse().forEach(item => {
    const spliceArgs = [ item.index, 1 ].concat(item.replaceWithValue)
    array.splice.apply(array, spliceArgs)
  })

  return array
}

},{"array-back":5,"test-value":16}],15:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match words composed of alphanumeric characters. */
var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

/** Used to match Latin Unicode letters (excluding mathematical operators). */
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsDingbatRange = '\\u2700-\\u27bf',
    rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
    rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
    rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
    rsPunctuationRange = '\\u2000-\\u206f',
    rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
    rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
    rsVarRange = '\\ufe0e\\ufe0f',
    rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

/** Used to compose unicode capture groups. */
var rsApos = "['\u2019]",
    rsAstral = '[' + rsAstralRange + ']',
    rsBreak = '[' + rsBreakRange + ']',
    rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']',
    rsDigits = '\\d+',
    rsDingbat = '[' + rsDingbatRange + ']',
    rsLower = '[' + rsLowerRange + ']',
    rsMisc = '[^' + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsUpper = '[' + rsUpperRange + ']',
    rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
var rsLowerMisc = '(?:' + rsLower + '|' + rsMisc + ')',
    rsUpperMisc = '(?:' + rsUpper + '|' + rsMisc + ')',
    rsOptLowerContr = '(?:' + rsApos + '(?:d|ll|m|re|s|t|ve))?',
    rsOptUpperContr = '(?:' + rsApos + '(?:D|LL|M|RE|S|T|VE))?',
    reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsEmoji = '(?:' + [rsDingbat, rsRegional, rsSurrPair].join('|') + ')' + rsSeq,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match apostrophes. */
var reApos = RegExp(rsApos, 'g');

/**
 * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
 * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
 */
var reComboMark = RegExp(rsCombo, 'g');

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/** Used to match complex or compound words. */
var reUnicodeWord = RegExp([
  rsUpper + '?' + rsLower + '+' + rsOptLowerContr + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
  rsUpperMisc + '+' + rsOptUpperContr + '(?=' + [rsBreak, rsUpper + rsLowerMisc, '$'].join('|') + ')',
  rsUpper + '?' + rsLowerMisc + '+' + rsOptLowerContr,
  rsUpper + '+' + rsOptUpperContr,
  rsDigits,
  rsEmoji
].join('|'), 'g');

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

/** Used to detect strings that need a more robust regexp to match words. */
var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;

/** Used to map Latin Unicode letters to basic Latin letters. */
var deburredLetters = {
  // Latin-1 Supplement block.
  '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
  '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
  '\xc7': 'C',  '\xe7': 'c',
  '\xd0': 'D',  '\xf0': 'd',
  '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
  '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
  '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
  '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
  '\xd1': 'N',  '\xf1': 'n',
  '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
  '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
  '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
  '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
  '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
  '\xc6': 'Ae', '\xe6': 'ae',
  '\xde': 'Th', '\xfe': 'th',
  '\xdf': 'ss',
  // Latin Extended-A block.
  '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
  '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
  '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
  '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
  '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
  '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
  '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
  '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
  '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
  '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
  '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
  '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
  '\u0134': 'J',  '\u0135': 'j',
  '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
  '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
  '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
  '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
  '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
  '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
  '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
  '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
  '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
  '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
  '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
  '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
  '\u0163': 't',  '\u0165': 't', '\u0167': 't',
  '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
  '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
  '\u0174': 'W',  '\u0175': 'w',
  '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
  '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
  '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
  '\u0132': 'IJ', '\u0133': 'ij',
  '\u0152': 'Oe', '\u0153': 'oe',
  '\u0149': "'n", '\u017f': 'ss'
};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array ? array.length : 0;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

/**
 * Converts an ASCII `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function asciiToArray(string) {
  return string.split('');
}

/**
 * Splits an ASCII `string` into an array of its words.
 *
 * @private
 * @param {string} The string to inspect.
 * @returns {Array} Returns the words of `string`.
 */
function asciiWords(string) {
  return string.match(reAsciiWord) || [];
}

/**
 * The base implementation of `_.propertyOf` without support for deep paths.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyOf(object) {
  return function(key) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
 * letters to basic Latin letters.
 *
 * @private
 * @param {string} letter The matched letter to deburr.
 * @returns {string} Returns the deburred letter.
 */
var deburrLetter = basePropertyOf(deburredLetters);

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

/**
 * Checks if `string` contains a word composed of Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a word is found, else `false`.
 */
function hasUnicodeWord(string) {
  return reHasUnicodeWord.test(string);
}

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return hasUnicode(string)
    ? unicodeToArray(string)
    : asciiToArray(string);
}

/**
 * Converts a Unicode `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}

/**
 * Splits a Unicode `string` into an array of its words.
 *
 * @private
 * @param {string} The string to inspect.
 * @returns {Array} Returns the words of `string`.
 */
function unicodeWords(string) {
  return string.match(reUnicodeWord) || [];
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol = root.Symbol;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `array` to a slice if it's needed.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {number} start The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the cast slice.
 */
function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : baseSlice(array, start, end);
}

/**
 * Creates a function like `_.lowerFirst`.
 *
 * @private
 * @param {string} methodName The name of the `String` case method to use.
 * @returns {Function} Returns the new case function.
 */
function createCaseFirst(methodName) {
  return function(string) {
    string = toString(string);

    var strSymbols = hasUnicode(string)
      ? stringToArray(string)
      : undefined;

    var chr = strSymbols
      ? strSymbols[0]
      : string.charAt(0);

    var trailing = strSymbols
      ? castSlice(strSymbols, 1).join('')
      : string.slice(1);

    return chr[methodName]() + trailing;
  };
}

/**
 * Creates a function like `_.camelCase`.
 *
 * @private
 * @param {Function} callback The function to combine each word.
 * @returns {Function} Returns the new compounder function.
 */
function createCompounder(callback) {
  return function(string) {
    return arrayReduce(words(deburr(string).replace(reApos, '')), callback, '');
  };
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the camel cased string.
 * @example
 *
 * _.camelCase('Foo Bar');
 * // => 'fooBar'
 *
 * _.camelCase('--foo-bar--');
 * // => 'fooBar'
 *
 * _.camelCase('__FOO_BAR__');
 * // => 'fooBar'
 */
var camelCase = createCompounder(function(result, word, index) {
  word = word.toLowerCase();
  return result + (index ? capitalize(word) : word);
});

/**
 * Converts the first character of `string` to upper case and the remaining
 * to lower case.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to capitalize.
 * @returns {string} Returns the capitalized string.
 * @example
 *
 * _.capitalize('FRED');
 * // => 'Fred'
 */
function capitalize(string) {
  return upperFirst(toString(string).toLowerCase());
}

/**
 * Deburrs `string` by converting
 * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
 * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
 * letters to basic Latin letters and removing
 * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to deburr.
 * @returns {string} Returns the deburred string.
 * @example
 *
 * _.deburr('déjà vu');
 * // => 'deja vu'
 */
function deburr(string) {
  string = toString(string);
  return string && string.replace(reLatin, deburrLetter).replace(reComboMark, '');
}

/**
 * Converts the first character of `string` to upper case.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.upperFirst('fred');
 * // => 'Fred'
 *
 * _.upperFirst('FRED');
 * // => 'FRED'
 */
var upperFirst = createCaseFirst('toUpperCase');

/**
 * Splits `string` into an array of its words.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to inspect.
 * @param {RegExp|string} [pattern] The pattern to match words.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Array} Returns the words of `string`.
 * @example
 *
 * _.words('fred, barney, & pebbles');
 * // => ['fred', 'barney', 'pebbles']
 *
 * _.words('fred, barney, & pebbles', /[^, ]+/g);
 * // => ['fred', 'barney', '&', 'pebbles']
 */
function words(string, pattern, guard) {
  string = toString(string);
  pattern = guard ? undefined : pattern;

  if (pattern === undefined) {
    return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
  }
  return string.match(pattern) || [];
}

module.exports = camelCase;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
'use strict'
const arrayify = require('array-back')
const t = require('typical')

/**
 * @module test-value
 * @example
 * const testValue = require('test-value')
 */
module.exports = testValue

/**
 * @alias module:test-value
 * @param {any} - a value to test
 * @param {any} - the test query
 * @param [options] {object}
 * @param [options.strict] {boolean} - Treat an object like a value not a query.
 * @returns {boolean}
 */
function testValue (value, test, options) {
  options = options || {}
  if (test !== Object.prototype && t.isPlainObject(test) && t.isObject(value) && !options.strict) {
    return Object.keys(test).every(function (prop) {
      let queryValue = test[prop]

      /* get flags */
      let isNegated = false
      let isContains = false

      if (prop.charAt(0) === '!') {
        isNegated = true
      } else if (prop.charAt(0) === '+') {
        isContains = true
      }

      /* strip flag char */
      prop = (isNegated || isContains) ? prop.slice(1) : prop
      let objectValue = value[prop]

      if (isContains) {
        queryValue = arrayify(queryValue)
        objectValue = arrayify(objectValue)
      }

      const result = testValue(objectValue, queryValue, options)
      return isNegated ? !result : result
    })
  } else if (test !== Array.prototype && Array.isArray(test)) {
    const tests = test
    if (value === Array.prototype || !Array.isArray(value)) value = [ value ]
    return value.some(function (val) {
      return tests.some(function (test) {
        return testValue(val, test, options)
      })
    })

  /*
  regexes queries will always return `false` for `null`, `undefined`, `NaN`.
  This is to prevent a query like `/.+/` matching the string `undefined`.
  */
  } else if (test instanceof RegExp) {
    if ([ 'boolean', 'string', 'number' ].indexOf(typeof value) === -1) {
      return false
    } else {
      return test.test(value)
    }
  } else if (test !== Function.prototype && typeof test === 'function') {
    return test(value)
  } else {
    return test === value
  }
}

/**
 * Returns a callback suitable for use by `Array` methods like `some`, `filter`, `find` etc.
 * @param {any} - the test query
 * @returns {function}
 */
testValue.where = function (test) {
  return function (value) {
    return testValue(value, test)
  }
}

},{"array-back":5,"typical":17}],17:[function(require,module,exports){
'use strict'

/**
 * For type-checking Javascript values.
 * @module typical
 * @typicalname t
 * @example
 * const t = require('typical')
 */
exports.isNumber = isNumber
exports.isString = isString
exports.isBoolean = isBoolean
exports.isPlainObject = isPlainObject
exports.isArrayLike = isArrayLike
exports.isObject = isObject
exports.isDefined = isDefined
exports.isFunction = isFunction
exports.isClass = isClass
exports.isPrimitive = isPrimitive
exports.isPromise = isPromise
exports.isIterable = isIterable

/**
 * Returns true if input is a number
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * > t.isNumber(0)
 * true
 * > t.isNumber(1)
 * true
 * > t.isNumber(1.1)
 * true
 * > t.isNumber(0xff)
 * true
 * > t.isNumber(0644)
 * true
 * > t.isNumber(6.2e5)
 * true
 * > t.isNumber(NaN)
 * false
 * > t.isNumber(Infinity)
 * false
 */
function isNumber (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

/**
 * A plain object is a simple object literal, it is not an instance of a class. Returns true if the input `typeof` is `object` and directly decends from `Object`.
 *
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * > t.isPlainObject({ clive: 'hater' })
 * true
 * > t.isPlainObject(new Date())
 * false
 * > t.isPlainObject([ 0, 1 ])
 * false
 * > t.isPlainObject(1)
 * false
 * > t.isPlainObject(/test/)
 * false
 */
function isPlainObject (input) {
  return input !== null && typeof input === 'object' && input.constructor === Object
}

/**
 * An array-like value has all the properties of an array, but is not an array instance. Examples in the `arguments` object. Returns true if the input value is an object, not null and has a `length` property with a numeric value.
 *
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * function sum(x, y){
 *     console.log(t.isArrayLike(arguments))
 *     // prints `true`
 * }
 */
function isArrayLike (input) {
  return isObject(input) && typeof input.length === 'number'
}

/**
 * returns true if the typeof input is `'object'`, but not null!
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isObject (input) {
  return typeof input === 'object' && input !== null
}

/**
 * Returns true if the input value is defined
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isDefined (input) {
  return typeof input !== 'undefined'
}

/**
 * Returns true if the input value is a string
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isString (input) {
  return typeof input === 'string'
}

/**
 * Returns true if the input value is a boolean
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isBoolean (input) {
  return typeof input === 'boolean'
}

/**
 * Returns true if the input value is a function
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isFunction (input) {
  return typeof input === 'function'
}

/**
 * Returns true if the input value is an es2015 `class`.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isClass (input) {
  if (isFunction(input)) {
    return /^class /.test(Function.prototype.toString.call(input))
  } else {
    return false
  }
}

/**
 * Returns true if the input is a string, number, symbol, boolean, null or undefined value.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isPrimitive (input) {
  if (input === null) return true
  switch (typeof input) {
    case "string":
    case "number":
    case "symbol":
    case "undefined":
    case "boolean":
      return true
    default:
      return false
  }
}

/**
 * Returns true if the input is a Promise.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isPromise (input) {
  if (input) {
    var isPromise = isDefined(Promise) && input instanceof Promise
    var isThenable = input.then && typeof input.then === 'function'
    return isPromise || isThenable ? true : false
  } else {
    return false
  }
}

/**
 * Returns true if the input is an iterable (`Map`, `Set`, `Array` etc.).
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isIterable (input) {
  if (input === null || !isDefined(input)) {
    return false
  } else {
    return typeof input[Symbol.iterator] === 'function'
  }
}

},{}],18:[function(require,module,exports){
(function (process){
module.exports = {
  emitKeypressEvents() {

  },
};
window.addEventListener("keydown", event => {
  const keyNames = {
    "ArrowUp": "up",
    "ArrowDown": "down",
    "ArrowRight": "right",
    "ArrowLeft": "left"
  };
  const keypressKeyDescriptor = {
    ctrl: event.ctrlKey,
    name: event.key in keyNames ? keyNames[event.key] : event.key
  };
  process.stdin.emit("keypress", "", keypressKeyDescriptor);
});
process.stdin = {
  setRawMode() {
    console.log("Setted raw mode...");
  },
  eventListeners: {},
  on(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
  },
  emit(eventName, ...args) {
    for (let listener of this.eventListeners[eventName]) {
      listener(...args);
    }
  }

};
process.stdout = {
  write(text) {
    if (window.onWrite) {
      window.onWrite(text);
    }
  }
};

}).call(this,require('_process'))
},{"_process":38}],19:[function(require,module,exports){
const helper = require('../../helper');

class StringMatrix {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.initSize();


  }
  initSize(width = this.width, height = this.height) {
    this.matrix = new Array(height).fill(new Array(width).fill(" ").join(""));


  }
  get string() {
    return this.matrix.join("\n");
  }
  insert(x, y, str) {
    for (var i = 0; i < str.length; i++) {
      const lineIndex = i + y;
      const line = this.matrix[lineIndex];
      const newLinePart = str[i];



      const newLine = StringMatrix.replaceAtPos(line, newLinePart, x);

      this.matrix[lineIndex] = newLine;
    }
  }
  static replaceAtPos(str, replaceStr, index) {
    return str.substring(0, index) + replaceStr + str.substring(index + replaceStr.length);
  }
}

module.exports = StringMatrix;

},{"../../helper":21}],20:[function(require,module,exports){
const { wrapWords, numberFromBits, indexesOfArray, centerLine } = require('../../helper');
const StringMatrix = require('./StringMatrix');

const isBrowser = typeof window !== 'undefined';

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

const groupSymbols = ["🖤", "💠", "💜", "🧡", "🔴", "💛", "💚", "🔵"];

const pieceSymbols = ["🚎", "🐧", "🗿", "🚀", "🦄", "🎷", "🚁", "🎓"];

const buildingSymbols = {
  normal: "🏠",
  hotel: "🏰"
};


module.exports = function RenderText(game, options = {}) {
  const fieldSize = {
    width: 14,
    height: isBrowser ? 8 : 6
  };
  // There normally exist 4 sides
  const sides = 4;
  // Amount of fields per side (10) (Practically, it is 11 but important for the calculation is just 10)
  const fieldsPerSide = game.board.map.length / sides;

  const boardSize = {
    width: fieldSize.width * (fieldsPerSide + 1) + 1,
    height: fieldSize.height * (fieldsPerSide + 1) + 1
  };

  const size = {
    width: boardSize.width + 40,
    height: boardSize.height + options.interactions.length
  };
  const matrix = new StringMatrix(size.width, size.height);

  drawBg();

  // Draw each field
  for (let i = 0; i < game.board.map.length; i++) {
    drawField(i);
  }

  // Re-draw the corner fields becaus etheir borders are overwritten by the following that does not thinks about the 2nd last field (which is always connected to it)
  for (let i = 0; i < game.board.map.length; i += fieldsPerSide) {
    drawField(i);
  }

  // Re-draw the focused field to overwrite the over-drawed bold border (that now is thin)
  // The field that will be drawn next to a bold one always over-draws the old bold boder with its thin border
  drawField(options.focus);


  drawCards({
    x: fieldSize.width + 2,
    y: fieldSize.height + 1,
    width: 35,
    height: 10,
    // Vertical centering with empty lines
    text: new Array().concat(new Array(Math.ceil((10 - 2 - 6) / 2)).fill(""), [
      "  ___  ",
      " |__ \\ ",
      "    ) |",
      "   / / ",
      "  |_|  ",
      "  (_)  "
    ], new Array(Math.trunc((10 - 2 - 6) / 2)).fill(""))
  });
  drawCards({
    x: -(fieldSize.width + 2),
    y: -(fieldSize.height + 1),
    width: 35,
    height: 10,
    // Vertical centering with empty lines
    text: new Array().concat(new Array(Math.ceil((10 - 2 - 8) / 2)).fill(""), (game.currentAction && false) ? [
      "",
      "",
      "",
      "",
      game.currentAction.action.message,
      "",
      "",
      ""
    ] : ([
      "  __________  ",
      " /\\____;;___\\ ",
      "| /         / ",
      "`. ())oo() .  ",
      " |\\(%()*^^()^\\",
      " | |-%-------|",
      " \\ |%________|",
      "  \\|%________|"
    ]), new Array(Math.trunc((10 - 2 - 8) / 2)).fill(""))
  });

  drawSelectedField();

  drawInteractionsList(options.interactions);

  var currY = 0;
  var currRow = 0;

  for (var i = 0; i < game.teams.length; i++) {
    drawTeam(game.teams[i], i);
  }


  function drawTeam(team, index) {
    const width = 30;

    const horizontalBorder = "─".repeat(width - 2);

    const ownedLines = team.fields.map(field => {
      return "│" + centerLine((groupSymbols[field.group] || fieldTypeEmojis[field.type](field)) + " " + field.name, width - 1) + "│";
    });

    const lines = [
      "┌" + horizontalBorder + "┐",
      "│" + centerLine("Team " + (team.index + 1) + " " + pieceSymbols[team.index], width - 1) + "│",
      "├" + horizontalBorder + "┤",
      "│" + " ".repeat(width - 2) + "│",
    ].concat(ownedLines, [
      "│" + " ".repeat(width - 2) + "│",
      "├" + horizontalBorder + "┤",
      "│" + centerLine("$" + team.wallet, width - 1) + "│",
      '└' + horizontalBorder + '┘'
    ]);

    const maxHeight = boardSize.height;

    const height = lines.length;

    if (currY + height > maxHeight) {
      currY = 0;
      currRow++;
    }

    matrix.insert(boardSize.width + (currRow * width) + 0, currY, lines);

    currY += height;
  }

  function drawBg() {

    const lines = [
      ' ___      ___     ______    _____  ___      ______    _______    ______    ___       ___  ___  ',
      '|"  \\    /\"  |   /    \" \\  (\\\"   \\|\"  \     /    \" \\  |   __ \"\\  /    \" \\  |\"  |     |\"  \\/\"  | ',
      ' \\   \\  //   |  // ____  \\ |.\\\\   \\    |  // ____  \\ (. |__) :)// ____  \\ ||  |      \\   \\  /  ',
      ' /\\\\  \\/.    | /  /    ) :)|: \\.   \\\\  | /  /    ) :)|:  ____//  /    ) :)|:  |       \\\\  \\/   ',
      '|: \\.        |(: (____/ // |.  \\    \\. |(: (____/ // (|  /   (: (____/ //  \\  |___    /   /    ',
      '|.  \\    /:  | \\        /  |    \\    \\ | \\        / /|__/ \\   \\        /  ( \\_|:  \\  /   /     ',
      '|___|\\__/|___|  \\\"_____/    \\___|\____\\)   \\\"_____/ (_______)   \\\"_____/    \\_______)|___/      '
    ];

    const width = lines[0].length;
    const height = lines.length;

    const x = Math.round(((fieldsPerSide + 1) * fieldSize.width) / 2 - width / 2);
    const y = Math.round(((fieldsPerSide + 1) * fieldSize.height) / 2 - height / 2);

    matrix.insert(x, y, lines);
  }

  function drawSelectedField() {
    const field = game.board.map[options.focus];

    const width = 38;

    const horizontalBorder = "─".repeat(width - 2);

    const symbolLineSpace = isBrowser ? (width - 6) : (width - 2);

    const symbolLine = (groupSymbols[field.group] || fieldTypeEmojis[field.type](field) || " ").repeat(symbolLineSpace).substring(0, symbolLineSpace);

    var lines = {
      get Street() {
        return [
          "┌" + horizontalBorder + "┐",
          "│" + symbolLine + "│",
          "│" + centerLine(field.name, width - 1) + "│",
          "│" + centerLine(field.level < 5 ? buildingSymbols.normal.repeat(field.level) : field.level ? buildingSymbols.hotel : "", width - 1) + "│",
          "├" + horizontalBorder + "┤",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Rent $" + field.baseRent, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 1 " + buildingSymbols.normal + " $" + field.getRent(1), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 2 " + buildingSymbols.normal + " $" + field.getRent(2), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 3 " + buildingSymbols.normal + " $" + field.getRent(3), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 4 " + buildingSymbols.normal + " $" + field.getRent(4), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With " + buildingSymbols.hotel + " $" + field.getRent(5), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("─".repeat(width - 8), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Houses (" + buildingSymbols.normal + ") cost $" + field.buildingCost, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Hotels (" + buildingSymbols.hotel + ") cost $" + field.buildingCost + " + 4 " + buildingSymbols.normal + "", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          '└' + horizontalBorder + '┘'
        ];
      },
      get Action() {

        return true ? ":" : ({
          chance: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("  _.--,-```-.    ", width - 1) + "│",
            "│" + centerLine(" /    /      '.  ", width - 1) + "│",
            "│" + centerLine("/  ../         ; ", width - 1) + "│",
            "│" + centerLine("\\  ``\\  .``-    '", width - 1) + "│",
            "│" + centerLine(" \\ ___\\/    \\   :", width - 1) + "│",
            "│" + centerLine("       \\    :   |", width - 1) + "│",
            "│" + centerLine("       |    ;  . ", width - 1) + "│",
            "│" + centerLine("      ;   ;   :  ", width - 1) + "│",
            "│" + centerLine("     /   :   :   ", width - 1) + "│",
            "│" + centerLine("     `---'.  |   ", width - 1) + "│",
            "│" + centerLine("      `--..`;    ", width - 1) + "│",
            "│" + centerLine("    .--,_        ", width - 1) + "│",
            "│" + centerLine("    |    |`.     ", width - 1) + "│",
            "│" + centerLine("    `-- -`, ;    ", width - 1) + "│",
            "│" + centerLine("      '---`\"     ", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            '└' + horizontalBorder + '┘'
          ],
          chest: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("                  _.--.          ", width - 1) + "│",
            "│" + centerLine("              _.-'_:-'||         ", width - 1) + "│",
            "│" + centerLine("          _.-'_.-::::'||         ", width - 1) + "│",
            "│" + centerLine("     _.-:'_.-::::::'  ||         ", width - 1) + "│",
            "│" + centerLine("   .'`-.-:::::::'     ||         ", width - 1) + "│",
            "│" + centerLine(" /.'`;|:::::::'      ||_         ", width - 1) + "│",
            "│" + centerLine("||   ||::::::'     _.;._'-._     ", width - 1) + "│",
            "│" + centerLine("||   ||:::::'  _.-!oo @.!-._'-.  ", width - 1) + "│",
            "│" + centerLine(" \\'.  ||:::::.-!()oo @!()@.-'_.| ", width - 1) + "│",
            "│" + centerLine("   '.'-;|:.-'.&$@.& ()$%-'o.\\||", width - 1) + "│",
            "│" + centerLine("     `>'-.!@%()@'@_%-'_.-o_|'||", width - 1) + "│",
            "│" + centerLine("     ||-._'-.@.-'_.-' _.-o |'|| ", width - 1) + "│",
            "│" + centerLine("     ||=[ '-._.-\\U/.-'    o |'|| ", width - 1) + "│",
            "│" + centerLine("     || '-.]=|| |'|      o  |'|| ", width - 1) + "│",
            "│" + centerLine("     ||      || |'|        _| '; ", width - 1) + "│",
            "│" + centerLine("     ||      || |'|    _.-'_.-'  ", width - 1) + "│",
            "│" + centerLine("     |'-._   || |'|_.-'_.-'      ", width - 1) + "│",
            "│" + centerLine("      '-._'-.|| |'`_.-'          ", width - 1) + "│",
            "│" + centerLine("        '-.||_/.-'               ", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            '└' + horizontalBorder + '┘'
          ]
        }[field.kind]);
      },
      get Tax() {
        return [
          "┌" + horizontalBorder + "┐",
          "│" + symbolLine + "│",
          "│" + centerLine(field.name, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "├" + horizontalBorder + "┤",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("       $$$$$      ", width - 1) + "│",
          "│" + centerLine("       $:::$      ", width - 1) + "│",
          "│" + centerLine("   $$$$$:::$$$$$$ ", width - 1) + "│",
          "│" + centerLine(" $$::::::::::::::$", width - 1) + "│",
          "│" + centerLine("$:::::$$$$$$$::::$", width - 1) + "│",
          "│" + centerLine("$::::$       $$$$$", width - 1) + "│",
          "│" + centerLine("$::::$            ", width - 1) + "│",
          "│" + centerLine("$::::$            ", width - 1) + "│",
          "│" + centerLine("$:::::$$$$$$$$$   ", width - 1) + "│",
          "│" + centerLine(" $$::::::::::::$$ ", width - 1) + "│",
          "│" + centerLine("   $$$$$$$$$:::::$", width - 1) + "│",
          "│" + centerLine("            $::::$", width - 1) + "│",
          "│" + centerLine("            $::::$", width - 1) + "│",
          "│" + centerLine("$$$$$       $::::$", width - 1) + "│",
          "│" + centerLine("$::::$$$$$$$:::::$", width - 1) + "│",
          "│" + centerLine("$::::::::::::::$$ ", width - 1) + "│",
          "│" + centerLine(" $$$$$$:::$$$$$   ", width - 1) + "│",
          "│" + centerLine("      $:::$       ", width - 1) + "│",
          "│" + centerLine("      $$$$$       ", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine(fieldTypeEmojis[field.type](field) + " $" + field.price, width - 1) + "│",
          '└' + horizontalBorder + '┘'
        ];
      },
      get Station() {
        return [
          "┌" + horizontalBorder + "┐",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine(field.name, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("    e@@@@@@@@@@@@@@@ ", width - 1) + "│",
          "│" + centerLine("   @@@\"\"\"\"\"\"\"\"\"\"     ", width - 1) + "│",
          "│" + centerLine("  @\" ___ ___________ ", width - 1) + "│",
          "│" + centerLine(" II__[w] | [i] [z] | ", width - 1) + "│",
          "│" + centerLine("{======|_|~~~~~~~~~| ", width - 1) + "│",
          "│" + centerLine("/oO--000'\"`-OO---OO-'", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Rent", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 1 station  $" + field.getRent(1), width - 1) + "│",
          "│" + centerLine("With 2 stations $" + field.getRent(2), width - 1) + "│",
          "│" + centerLine("With 2 stations $" + field.getRent(3), width - 1) + "│",
          "│" + centerLine("With 2 stations $" + field.getRent(4), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("$" + field.price, width - 1) + "│",
          '└' + horizontalBorder + '┘'
        ];
      },
      get Company() {
        return {
          electricity: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine(field.name, width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("        ___        ", width - 1) + "│",
            "│" + centerLine("    .-\"`   `\"-.    ", width - 1) + "│",
            "│" + centerLine("  .'           '.  ", width - 1) + "│",
            "│" + centerLine(" /               \\ ", width - 1) + "│",
            "│" + centerLine("/  #              \\", width - 1) + "│",
            "│" + centerLine("| #               |", width - 1) + "│",
            "│" + centerLine("|                 |", width - 1) + "│",
            "│" + centerLine(";     .-~~~-.     ;", width - 1) + "│",
            "│" + centerLine(" ;     )   (     ; ", width - 1) + "│",
            "│" + centerLine("  \\   (     )   /  ", width - 1) + "│",
            "│" + centerLine("   \\   \\   /   /   ", width - 1) + "│",
            "│" + centerLine("    \\   ) (   /    ", width - 1) + "│",
            "│" + centerLine("     |  | |  |     ", width - 1) + "│",
            "│" + centerLine("     |__|_|__|     ", width - 1) + "│",
            "│" + centerLine("     {=======}     ", width - 1) + "│",
            "│" + centerLine("     }======={     ", width - 1) + "│",
            "│" + centerLine("     {=======}     ", width - 1) + "│",
            "│" + centerLine("     }======={     ", width - 1) + "│",
            "│" + centerLine("     {=======}     ", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("Rent $ 4 * moved steps", width - 1) + "│",
            "│" + centerLine("Both companies $ 10 * moved steps", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("$" + field.price, width - 1) + "│",
            '└' + horizontalBorder + '┘'
          ],
          water: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine(field.name, width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("        T              ", width - 1) + "│",
            "│" + centerLine("    ⊕───┴───⊕          ", width - 1) + "│",
            "│" + centerLine("       │ │             ", width - 1) + "│",
            "│" + centerLine("      ╱___╲            ", width - 1) + "│",
            "│" + centerLine(",────┤─────├───────.   ", width - 1) + "│",
            "│" + centerLine("│        -    -     ╲  ", width - 1) + "│",
            "│" + centerLine("`────/_____\\────.    ╲ ", width - 1) + "│",
            "│" + centerLine("       ───       ╲    │", width - 1) + "│",
            "│" + centerLine("                  │   │", width - 1) + "│",
            "│" + centerLine("                  │   │", width - 1) + "│",
            "│" + centerLine("                  │   │", width - 1) + "│",
            "│" + centerLine("                  │___│", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("Rent $ 4 * moved steps", width - 1) + "│",
            "│" + centerLine("Both companies $ 10 * moved steps", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("$" + field.price, width - 1) + "│",
            '└' + horizontalBorder + '┘'
          ]
        }[field.kind];
      }
    }[field.type];

    if (!lines) {
      return;
    }

    //lines = new Array(20).fill("🖤".repeat(20 - 2).substring(0, 20 - 2));

    const height = lines.length;

    const x = Math.round(((fieldsPerSide + 1) * fieldSize.width) / 2 - width / 2);
    const y = Math.round(((fieldsPerSide + 1) * fieldSize.height) / 2 - height / 2);



    matrix.insert(x, y, lines);

    setTimeout(function() {
      //console.log(x, y);
    })

  }


  function drawInteractionsList(interactions) {
    matrix.insert(0, fieldSize.height * (fieldsPerSide + 1) + 1, interactions);
  }

  function drawCards(options) {
    var { x, y, width, height, text } = options;
    // Invert negative coordinates to be offset from right border
    x = (boardSize.width + x) % boardSize.width - width * (x < 0);
    // Invert negative coordinates to be offset from bottom border
    y = (boardSize.height + y) % boardSize.height - height * (y < 0);

    const horizontalBorder = '─'.repeat(width - 2);
    const space = ' '.repeat(width - 2);

    const lines = new Array().concat('┌' + horizontalBorder + '┐',
          new Array(height - 2).fill('│' +      space       + '│'),
                                     '└' + horizontalBorder + '┘');

   matrix.insert(x, y, lines);

   matrix.insert(x + 1, y + 1, text.map(line => {
     return centerLine(line, width - 2);
   }));
  }

  function drawField(i) {
    const field = game.board.map[i];
    // Getting the relative index of current field within its side
    const relIndex = i % fieldsPerSide;
    // Getting the index of the side, the field is a part of
    const side = Math.trunc(i / fieldsPerSide);

    const relPos = {
      x: !(side % 2) ? fieldSize.width * fieldsPerSide * !!side : relIndex * fieldSize.width,
      y: side % 2 ? fieldSize.height * fieldsPerSide * !(side % 3) : relIndex * fieldSize.height
    };

    // Relative positions for each side
    const relPositions = [
      {
        x: 0,
        y: (fieldsPerSide - relIndex) * fieldSize.height
      },
      {
        x: relIndex * fieldSize.width,
        y: 0
      },
      {
        x: fieldsPerSide * fieldSize.width,
        y: relIndex * fieldSize.height
      },
      {
        x: (fieldsPerSide - relIndex) * fieldSize.width,
        y: fieldsPerSide * fieldSize.height
      }
    ];


    const currPos = relPositions[side];


    const borderingSides = getBorderingSides(i, side);

    matrix.insert(currPos.x, currPos.y, getField(i, borderingSides));


    const fieldNameWrapped = wrapWords(getFieldName(field), fieldSize.width - 1);
    // Concat specific emoji as own line to wrapped name lines
    const fieldTypeSymbol = field.type in fieldTypeEmojis ? fieldTypeEmojis[field.type](field) : "";

    const fieldDescriptionWrapped = wrapWords(field.description || "", fieldSize.width - 1);

    var fieldTitleLines = [
      (field.level < 5 ? buildingSymbols.normal.repeat(Math.trunc((field.level || 0) / 2)) : "") + (groupSymbols[field.group] || "") + (field.level < 5 ? buildingSymbols.normal.repeat(Math.ceil((field.level || 0) / 2)) : (field.level ? buildingSymbols.hotel : "")),
    ].concat(fieldNameWrapped, fieldTypeSymbol, fieldDescriptionWrapped);
    // Filter title lines for invalid ones (undefined)
    fieldTitleLines = fieldTitleLines.filter(line => line)

    const fieldHeight = fieldSize.height - 1;
    // Fill up lines to bottom
    for (let i = fieldTitleLines.length; i < fieldHeight; i++) fieldTitleLines.push("");

    // Write price of current field to last line (bottom)
    const priceLineIndex = getLastEmptyIndex(fieldTitleLines, 0);
    fieldTitleLines[priceLineIndex] = getFieldPrice(field) || fieldTitleLines[priceLineIndex];

    // Write pieces of current field to second last line
    const piecesLineIndex = getLastEmptyIndex(fieldTitleLines, 1);
    const piecesLines = getFieldPieces(field);
    fieldTitleLines[piecesLineIndex] = (piecesLines[0] || [""]).join(" ") || fieldTitleLines[piecesLineIndex];

    // Center each line
    fieldTitleLines = fieldTitleLines.map(line => centerLine(line, fieldSize.width));

    matrix.insert(currPos.x + 1, currPos.y + 1, fieldTitleLines);
  }

  function getLastEmptyIndex(array, lastAlternativeIndex = 0) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (!array[i]) {
        return i;
      }
    }
    return array.length - 1 - lastAlternativeIndex;
  }

  function getFieldPrice(field) {
    return "price" in field ? ("$" + field.price.toString()) : "";
  }

  function getFieldPieces(field) {
    // Indexes of all pieces that are currently staying on this field
    // (Getting all pieces whose index is the current field's index)
    const pieceStayingIndexes = indexesOfArray(options.pieces, field.index);

    const maxPiecesPerLine = (fieldSize.width - 2) / 3;
    const lines = new Array(Math.ceil(pieceStayingIndexes.length / maxPiecesPerLine)).fill(true).map((val, index) => {
      const pieces = pieceStayingIndexes.slice(index * maxPiecesPerLine, (index + 1) * maxPiecesPerLine);
      return pieces.map(pieceIndex => pieceSymbols[pieceIndex]);
    });

    return lines;
  }

  function getFieldName(field) {
    const fieldTypeSymbol = field.type in fieldTypeEmojis ? fieldTypeEmojis[field.type](field) : "";
    return (field.name || "") + "" //+ fieldTypeSymbol;
  }

  function getBorderingSides(index, side) {
    const lastField = index ? game.board.map[index - 1] : game.board.map.last;
    const nextField = index < game.board.map.length - 1 ? game.board.map[index + 1] : game.board.map[0];

    // Getting the index of the side, the last field is a part of
    const lastFieldSideIndex = Math.trunc(lastField.index / fieldsPerSide);
    // Getting the index of the side, the next field is a part of
    const nextFieldSideIndex = Math.trunc(nextField.index / fieldsPerSide);

    // List of normal (!) bordering sides for each side
    // First item of both side sis the one, the direction is drawing to
    const fieldSideBorders = [
      [0, 2],
      [1, 3],
      [2, 0],
      [3, 1]
    ];
    // Get bordering sides for last field
    const borderingSides = fieldSideBorders[lastFieldSideIndex];

    // Get the difference between current field's side and the last field one's (If 0, the field is straight on the way, if 1, there was a changing of side)
    const lastSideDiff = side - lastFieldSideIndex;

    // The side changing difference is added to the first side index within the list of bordering fields (the first rotates)
    borderingSides[0] += lastSideDiff;

    return new Array(4).fill(false).map((sideValue, sideIndex) => borderingSides.includes(sideIndex));
  }

  function getField(index, sides) {


    /*
      NOTE
      Each char identifier represents the binary result of the both related sides (they are 1 if there lies a field on and 0 if not)
      The array 'sides' contains the list of all sides (top, right, bottom, left) and wether there is field surrounding

    */

    // Return list of all matching cases for the field (e.g. focused field) that "are the case"
    const charCases = (() => {
      const modifiersBoolean = {
        // Default case is always true
        default: true,
        // Focused case is true if the field's index is equal to the focused index
        focused: options.focus === index
      };
      return Object.keys(modifiersBoolean).filter(modifierName => modifiersBoolean[modifierName]);
    })();

    // Because we can only use one case , use the last one (Except 'default' there should not exist any other case)
    const charMode = charCases.last;


    const corners = [
      {
        relatedSides: [0, 3],
        0b00: {
          default: "┌",
          focused: "┏"
        },
        0b10: {
          default: "┬",
          focused: "┲"
        },
        0b01: {
          default: "├",
          focused: "┢"
        },
        0b11: {
          default: "┼",
          focused: "╆"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      },
      {
        relatedSides: [0, 1],
        0b00: {
          default: "┐",
          focused: "┓"
        },
        0b10: {
          default: "┬",
          focused: "┱"
        },
        0b01: {
          default: "┤",
          focused: "┪"
        },
        0b11: {
          default: "┼",
          focused: "╅"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      },
      {
        relatedSides: [1, 2],
        0b00: {
          default: "┘",
          focused: "┛"
        },
        0b10: {
          default: "┤",
          focused: "┩"
        },
        0b01: {
          default: "┴",
          focused: "┹"
        },
        0b11: {
          default: "┼",
          focused: "╃"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      },
      {
        relatedSides: [2, 3],
        0b00: {
          default: "└",
          focused: "┗"
        },
        0b10: {
          default: "┴",
          focused: "┺"
        },
        0b01: {
          default: "├",
          focused: "┡"
        },
        0b11: {
          default: "┼",
          focused: "╄"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      }
    ];

    for (let corner of corners) {
      // Get the related sides boolean values from the original 'sides' array
      // There always exist 4 sides [top, right, bottom, left] that are true or false but each corner just need two specific sides to decide which char is used
      const relatedSides = corner.relatedSides.map(sideIndex => sides[sideIndex]); // Now has length of 2

      // Char identifier is the binary number that results from interpreting each side's boolean value (true | false) as bit
      const charIdentifier = numberFromBits(relatedSides);

      corner.charIdentifier = charIdentifier;
    }

    const borderChars = {
      horizontal: {
        default: "─",
        focused: isBrowser ? "─" : "━"
      },
      vertical: {
        default: "│",
        focused: "┃"
      }
    };

    const borderLine = "" + borderChars.horizontal[charMode].repeat(fieldSize.width - 1);
    const innerSpace = " ".repeat(fieldSize.width - 1);

    return [corners[0].char + borderLine + corners[1].char].concat(
           new Array(fieldSize.height - 1).fill(borderChars.vertical[charMode] + innerSpace + borderChars.vertical[charMode]))
           .concat([corners[3].char + borderLine + corners[2].char]);
  }

  return matrix.string;

};

},{"../../helper":21,"./StringMatrix":19}],21:[function(require,module,exports){


module.exports = {
  objFillDefaults(obj, template) {
    for (var key in template) {
      if (template.hasOwnProperty(key)) {
        let prop = template[key];
        if (typeof prop == "object" && prop != null) {
          obj[key] = module.exports.objFillDefaults((obj[key] || (prop instanceof Array ? [] : {})), prop);
        }
        else if (!(key in obj)) {
          obj[key] = prop;
        }
      }
    }
    return obj;
  },
  arrayLast(array) {
    return array[array.length - 1];
  },
  splitWordsMaxLength(str, max) {
    //str = str.replace(/\s{1,}/g, " ");

    var words = [];
    while (str) {
      const nextWordPos = str.search(/\s/);
      if (nextWordPos < max && nextWordPos != -1) {
        words.push(str.substring(0, nextWordPos));
        str = str.substring(nextWordPos + 1);
      }
      else {
        words.push(str.substring(0, max));
        if (str.length >= max) {
          str = str.substring(max);
        }
        else {
          str = null;
        }
      }
    }
    return words;
  },
  wrapWords(str, maxLength) {

    const words = module.exports.splitWordsMaxLength(str, maxLength);

    const lines = [""];
    for (let word of words) {
      if (word.length + lines.last.length < maxLength) {
        lines[lines.length - 1] += (lines.last.length ? " " : "") + word;
      }
      else {
        lines.push(word);
      }
    }


    return lines.filter(line => line);
  },
  numberFromBits(bits) {
    var number = 0;
    for (var n = 0; n < bits.length; n++) {
      number += 2 ** n * bits[n];
    }
    return number;
  },
  fancyCount2(str){
    const joiner = "\u{200D}";
    const split = str.split(joiner);
    let count = 0;

    for(const s of split){
      //removing the variation selectors
      const num = Array.from(s.split(/[\ufe00-\ufe0f]/).join("")).length;
      count += num;
    }

    //assuming the joiners are used appropriately
    return count / split.length;
  },
  indexesOf(str, regex, start = 0) {
    const positions = [];

    while (str.substring(start).search(regex) > -1) {
      const pos = str.substring(start).search(regex) + start;
      positions.push(pos);
      start = pos + 1;
    }

    return positions;
  },
  indexesOfArray(array, item, start = 0) {
    const positions = [];

    while (array.indexOf(item, start) > -1) {
      const pos = array.indexOf(item, start);
      positions.push(pos);
      start = pos + 1;
    }

    return positions;
  },
  centerLine(line, width) {
    const centerSpace = (width - 1 - line.length) / 2;
    const space = [Math.trunc(centerSpace), Math.ceil(centerSpace)];

    return " ".repeat(space[0] >= 0 ? space[0] : 0) + line + " ".repeat(space[1] >= 0 ? space[1] : 0);
  }

};

Object.defineProperty(Array.prototype, "last", {
  get() {
    return module.exports.arrayLast(this);
  }
});

Array.prototype.indexOfKey = function(value, key, start = 0) {
  for (var i = start; i < this.length; i++) {
    if (this[i][key] === value) {
      return i;
    }
  }
  return -1;
}
Array.prototype.objectFromKey = function(value, key, start = 0) {
  var index = this.indexOfKey(value, key, start);
  var item = this[index];
  //item.__index = index;
  return item;
}

Math.randomNumber = function(start, end, round = false) {
  const number = start + (Math.random() * (end - start));
  return round ? Math.trunc(number) : number;
}

/*Object.defineProperty(String.prototype, "length", {
  get() {
    return fancyCount2(this);
  }
});*/

},{}],22:[function(require,module,exports){
const { objFillDefaults } = require('./helper');
const { EventEmitter } = require('events');

const Team = require('./Team');

class Monopoly extends EventEmitter {

  constructor(options = {}) {
    super();
    const self = this;

    const opts = objFillDefaults(options, {
      board: {},
      teams: 2
    });
    opts.board.pieces = opts.teams;
    this.board = new Monopoly.MonopolyBoard(opts.board);

    this.teams = new Array(opts.teams).fill(true).map((value, index) => {
      return new Team(this, index, 5000);
    });

    this.currentAction = null;


  }
  payment(payingTeam, targetTeam, amount) {
    payingTeam.wallet -= amount;
    targetTeam.wallet += amount;

    return {};
  }
  action(actionRecord, team) {
    return this.board.actions.methods[actionRecord.type](team, actionRecord.fields);
  }
  // Firing all related eventsto next actions
  nextActions(actions) {
    for (let actionName in actions) {
      if (actions.hasOwnProperty(actionName)) {
        // If current action is valid
        if (actions[actionName]) {
          // Emit the action related event from its name with the action specific data
          this.emit("payment", actions[actionName]);
        }
      }
    }
  }
}
Monopoly.MonopolyBoard = require('./monopoly-board');

if (typeof window !== 'undefined') {
  window.Monopoly = Monopoly;
}


module.exports = Monopoly;

},{"./Team":1,"./helper":21,"./monopoly-board":23,"events":37}],23:[function(require,module,exports){
const { objFillDefaults } = require('../helper');
const fs = require('fs');
const { EventEmitter } = require('events');

class MonopolyBoard {
  constructor(options) {
    const self = this;

    const opts = objFillDefaults(options, {
      // Board serial that will be filled up with field instances
      map: MonopolyBoard.BOARD_DEFAULT_EN,
      // Object containing possible field classes
      fields: MonopolyBoard.FIELDS_DEFAULT,
      actions: MonopolyBoard.ACTIONS_DEFAULT,
      pieces: 2
    });

    this.map = opts.map.map((field, i) => {
      // Return new instance of current field using its related field class instance and passing the 'detail' object to the constructor
      const currField = new opts.fields[field.type](field.detail, this);
      currField.index = i;
      currField.type = field.type;
      return currField;
    });

    this.pieces = new Array(opts.pieces).fill(true).map(() => ({
      position: 0,
      get field() {
        return self.map[this.position];
      }
    }));

    this.actions = opts.actions;
  }
  // Get all fields that relate to the same group by the group's id
  getGroup(id) {
    // Filter for euqality of field's id and searched one
    return this.map.filter(field => field.group === id);
  }

}
//MonopolyBoard.BOARD_DEFAULT_EN = JSON.parse(fs.readFileSync(__dirname + "/default/BOARD_EN.json", "utf8"));
MonopolyBoard.BOARD_DEFAULT_EN = require("./default/BOARD_EN");
MonopolyBoard.ACTIONS_DEFAULT = require("./default/ACTIONS_DEFAULT");
MonopolyBoard.FIELDS_DEFAULT = {
  Start: require('./fields/FieldStart'),
  Street: require("./fields/FieldStreet"),
  Action: require("./fields/FieldAction"),
  Tax: require("./fields/FieldTax"),
  Station: require("./fields/FieldStation"),
  Jail: require("./fields/FieldJail"),
  Company: require("./fields/FieldCompany"),
  Empty: require("./fields/FieldEmpty"),
  Police: require("./fields/FieldPolice")
};

module.exports = MonopolyBoard;

},{"../helper":21,"./default/ACTIONS_DEFAULT":24,"./default/BOARD_EN":25,"./fields/FieldAction":27,"./fields/FieldCompany":28,"./fields/FieldEmpty":29,"./fields/FieldJail":30,"./fields/FieldPolice":31,"./fields/FieldStart":32,"./fields/FieldStation":33,"./fields/FieldStreet":34,"./fields/FieldTax":35,"events":37,"fs":36}],24:[function(require,module,exports){
module.exports = {
  generators: [
    team => {
      const steps = Math.randomNumber(1, 12, true);
      return {
        type: "movement",
        wait: true,
        message: "" + team.name + " has to move " + steps + " steps",
        fields: {
          steps: steps
        }
      }
    },
    team => {
      const tax = [25, 50, 100, 200, 300, 400][Math.randomNumber(0, 6, true)];
      return {
        type: "tax",
        wait: false,
        message: "" + team.name + " has to pay $" + tax + " tax",
        fields: {
          tax: tax
        }
      }
    }
  ],
  methods: {
    movement(team, field) {
      return team.move(field.steps);
    },
    tax(team, fields) {
      return team.payTax(fields.tax);
    }
  }
};

},{}],25:[function(require,module,exports){
module.exports = [
  {
    "type": "Start",
    "detail": {
      "name": "Start",
      "description": "Collect $200 salary as you pass"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Old Kent Road",
      "price": 60,
      "baseRent": 2,
      "group": 0
    }
  },
  {
    "type": "Action",
    "detail": {
      "name": "Commnunity Chest",
      "kind": "chest"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Whitechapel Road",
      "price": 60,
      "baseRent": 4,
      "group": 0
    }
  },
  {
    "type": "Tax",
    "detail": {
      "name": "Tax",
      "price": 100
    }
  },
  {
    "type": "Station",
    "detail": {
      "name": "Kings Cross Station",
      "price": 200,
      "baseRent": 25,
      "group": 8
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "The Angel, Islignton",
      "price": 100,
      "baseRent": 6,
      "group": 1
    }
  },
  {
    "type": "Action",
    "detail": {
      "name": "Chance",
      "kind": "chance"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Eusten Road",
      "price": 100,
      "baseRent": 6,
      "group": 1
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Pentoville Road",
      "price": 120,
      "baseRent": 8,
      "group": 1
    }
  },
  {
    "type": "Jail",
    "detail": {
      "name": "In Jail",
      "description": "Just visiting"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Pall Mall",
      "price": 140,
      "baseRent": 10,
      "group": 2
    }
  },
  {
    "type": "Company",
    "detail": {
      "name": "Electric Company",
      "kind": "electricity",
      "price": 150,
      "group": 9
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Whitehall",
      "price": 140,
      "baseRent": 10,
      "group": 2
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Northumberl'd Avenue",
      "price": 160,
      "baseRent": 12,
      "group": 2
    }
  },
  {
    "type": "Station",
    "detail": {
      "name": "Marylebone Station",
      "price": 200,
      "baseRent": 25,
      "group": 8
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Bow Street",
      "price": 180,
      "baseRent": 14,
      "group": 3
    }
  },
  {
    "type": "Action",
    "detail": {
      "name": "Commnunity Chest",
      "kind": "chest"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Marlborough Street",
      "price": 180,
      "baseRent": 14,
      "group": 3
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Vine Street",
      "price": 200,
      "baseRent": 16,
      "group": 3
    }
  },
  {
    "type": "Empty",
    "detail": {
      "name": "Free Parking"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Strand",
      "price": 220,
      "baseRent": 18,
      "group": 4
    }
  },
  {
    "type": "Action",
    "detail": {
      "name": "Chance",
      "kind": "chance"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Fleet Street",
      "price": 220,
      "baseRent": 18,
      "group": 4
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Trafalgar Square",
      "price": 240,
      "baseRent": 20,
      "group": 4
    }
  },
  {
    "type": "Station",
    "detail": {
      "name": "Fenchurch St. Station",
      "price": 200,
      "baseRent": 25,
      "group": 8
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Leicester Square",
      "price": 260,
      "baseRent": 22,
      "group": 5
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Conventry Street",
      "price": 260,
      "baseRent": 22,
      "group": 5
    }
  },
  {
    "type": "Company",
    "detail": {
      "name": "Water Works",
      "kind": "water",
      "price": 150,
      "group": 9
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Piccadelly",
      "price": 280,
      "baseRent": 24,
      "group": 5
    }
  },
  {
    "type": "Police",
    "detail": {
      "name": "Go to Jail",
      "target": 10
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Regent Street",
      "price": 300,
      "baseRent": 26,
      "group": 6
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Oxford Street",
      "price": 300,
      "baseRent": 26,
      "group": 6
    }
  },
  {
    "type": "Action",
    "detail": {
      "name": "Commnunity Chest",
      "kind": "chest"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Bond Street",
      "price": 320,
      "baseRent": 28,
      "group": 6
    }
  },
  {
    "type": "Station",
    "detail": {
      "name": "Liverpool St. Station",
      "price": 200,
      "baseRent": 25,
      "group": 8
    }
  },
  {
    "type": "Action",
    "detail": {
      "name": "Chance",
      "kind": "chance"
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Park Lane",
      "price": 350,
      "baseRent": 35,
      "group": 7
    }
  },
  {
    "type": "Tax",
    "detail": {
      "name": "Tax",
      "price": 100
    }
  },
  {
    "type": "Street",
    "detail": {
      "name": "Mayfair",
      "price": 400,
      "baseRent": 50,
      "group": 7
    }
  }
]

},{}],26:[function(require,module,exports){


class Field {
  constructor(details, board) {
    // Set refernece to board, field lies on
    this.__board = board;

    // Append each property of 'details' directly to the field instance
    for (var key in details) {
      if (details.hasOwnProperty(key)) {
        this[key] = details[key];
      }
    }
  }
  get collection() {
    return this.__board.getGroup(this.group);
  }
  // Returns all fields of their collection that are owned by a given owner
  ownOfCollection(owner) {
    return this.collection.filter(field => field.owner == owner);
  }
  // Returns (if possible), the single owner of the whole collection | If the collection is not owned by a single team, return null
  get collectionOwner() {
    return this.ownOfCollection(this.collection[0].owner).length == this.collection.length ? this.collection[0].owner : null;
  }
}
module.exports = Field;

},{}],27:[function(require,module,exports){
const Field = require('./Field');

class Action extends Field {
  constructor(details, board) {
    super(details, board);


  }
  // Returns a 'nextActions' object
  enter(team) {
    const action = this.__board.actions.generators[Math.randomNumber(0, this.__board.actions.generators.length, true)](team);

    return {
      purchase: false,
      // If the entered field's owner is not the current team, return a payment literal
      payment: undefined,
      building: false,
      tax: undefined,
      action: {
        type: "Commnunity Chest",
        action: action
      }
    };
  }
}

module.exports = Action;

},{"./Field":26}],28:[function(require,module,exports){
const Field = require('./Field');

class Company extends Field {
  constructor(details, board) {
    super(details, board);
  }
  getRent(moveSteps) {
    return this.owner ? (moveSteps * [4, 10][this.ownOfCollection(this.owner).length - 1]) : null;
  }
  enter(team, movement) {
    return {
      purchase: !this.owner,
      // If the entered field's owner is not the current team, return a payment literal
      payment: this.owner && this.owner != this ? ({
        creditor: this.owner, // Team to pay to
        debtor: team, // The team that has to pay
        amount: this.getRent(movement.steps) // Amount to pay
      }) : undefined,
      building: false,
      tax: undefined
    };
  }
}

module.exports = Company;

},{"./Field":26}],29:[function(require,module,exports){
const Field = require('./Field');

class Empty extends Field {
  constructor(details, board) {
    super(details, board);

  }
}

module.exports = Empty;

},{"./Field":26}],30:[function(require,module,exports){
const Field = require('./Field');

class Jail extends Field {
  constructor(details, board) {
    super(details, board);

  }
}

module.exports = Jail;

},{"./Field":26}],31:[function(require,module,exports){
const Field = require('./Field');

class Police extends Field {
  constructor(details, board) {
    super(details, board);

  }
  enter(team) {
    team.jail = true;
    return {
      purchase: false,
      // If the entered field's owner is not the current team, return a payment literal
      payment: undefined,
      building: false,
      tax: undefined,
      movement: team.game.board.map.find(field => field.type === "Jail")
    };
  }
}

module.exports = Police;

},{"./Field":26}],32:[function(require,module,exports){
const Field = require('./Field');

class Start extends Field {
  constructor(details, board) {
    super(details, board);

  }
  enter(team) {
    return {
      purchase: false,
      // If the entered field's owner is not the current team, return a payment literal
      payment: undefined,
      building: false,
      // $ -200 tax is the $(400 - 200) you get when you land directly on START
      tax: -200
    };
  }
}

module.exports = Start;

},{"./Field":26}],33:[function(require,module,exports){
const Field = require('./Field');

class Station extends Field {
  constructor(details, board) {
    super(details, board);

  }
  get rent() {
    return this.owner ? this.getRent(this.ownOfCollection(this.owner).length) : null;
  }
  getRent(ownAmount) {
    return this.baseRent * ownAmount;
  }
  enter(team) {
    return {
      purchase: !this.owner,
      // If the entered field's owner is not the current team, return a payment literal
      payment: this.owner && this.owner != this ? ({
        creditor: this.owner, // Team to pay to
        debtor: team, // The team that has to pay
        amount: this.rent // Amount to pay
      }) : undefined,
      building: false,
      tax: undefined
    };
  }
}
Station.prototype.owner = null;
module.exports = Station;

},{"./Field":26}],34:[function(require,module,exports){
const Field = require('./Field');

class Street extends Field {
  constructor(details, board) {
    super(details, board);


  }

  get monopoly() {
    return !this.collection.map(field => !!field.owner && field.owner == this.collection[0].owner).includes(false);
  }
  get monopolyOwner() {
    return this.monopoly ? this.owner : null;
  }
  get rent() {
    return this.getRent(this.level);
  }
  getRent(level) {
    return this.baseRent * [1, 5, 15, 45, 80, 125][level];
  }
  buildingAllowed(team) {
    //return this.__map
    return team === this.owner;
  }
  get buildingCost() {
    return [50, 50, 100, 100, 150, 150, 200, 200][this.group];
  }
  get interactions() {
    return {

    };
  }
  // Returns a 'nextActions' object
  enter(team) {
    return {
      purchase: !this.owner,
      // If the entered field's owner is not the current team, return a payment literal
      payment: this.owner && this.owner != team ? ({
        creditor: this.owner, // Team to pay to
        debtor: team, // The team that has to pay
        amount: this.rent // Amount to pay
      }) : undefined,
      building: team === this.owner,
      tax: undefined
    };
  }
}
Street.prototype.level = 0;
Street.prototype.owner = null;

module.exports = Street;

},{"./Field":26}],35:[function(require,module,exports){
const Field = require('./Field');

class Tax extends Field {
  constructor(details, board) {
    super(details, board);

  }
  enter(team) {

    return {
      purchase: undefined,
      // If the entered field's owner is not the current team, return a payment literal
      payment: undefined,
      building: undefined,
      tax: this.price
    };
  }
}

module.exports = Tax;

},{"./Field":26}],36:[function(require,module,exports){

},{}],37:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],38:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[3]);
