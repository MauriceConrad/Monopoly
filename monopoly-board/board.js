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
