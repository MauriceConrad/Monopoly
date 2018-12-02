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
