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

},{}],3:[function(require,module,exports){
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

},{"./Team":1,"./helper":2,"./monopoly-board":4,"events":18}],4:[function(require,module,exports){
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

},{"../helper":2,"./default/ACTIONS_DEFAULT":5,"./default/BOARD_EN":6,"./fields/FieldAction":8,"./fields/FieldCompany":9,"./fields/FieldEmpty":10,"./fields/FieldJail":11,"./fields/FieldPolice":12,"./fields/FieldStart":13,"./fields/FieldStation":14,"./fields/FieldStreet":15,"./fields/FieldTax":16,"events":18,"fs":17}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){


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

},{}],8:[function(require,module,exports){
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

},{"./Field":7}],9:[function(require,module,exports){
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

},{"./Field":7}],10:[function(require,module,exports){
const Field = require('./Field');

class Empty extends Field {
  constructor(details, board) {
    super(details, board);

  }
}

module.exports = Empty;

},{"./Field":7}],11:[function(require,module,exports){
const Field = require('./Field');

class Jail extends Field {
  constructor(details, board) {
    super(details, board);

  }
}

module.exports = Jail;

},{"./Field":7}],12:[function(require,module,exports){
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

},{"./Field":7}],13:[function(require,module,exports){
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

},{"./Field":7}],14:[function(require,module,exports){
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

},{"./Field":7}],15:[function(require,module,exports){
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

},{"./Field":7}],16:[function(require,module,exports){
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

},{"./Field":7}],17:[function(require,module,exports){

},{}],18:[function(require,module,exports){
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

},{}]},{},[3]);
