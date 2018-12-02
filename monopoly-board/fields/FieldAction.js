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
