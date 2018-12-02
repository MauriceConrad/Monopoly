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
