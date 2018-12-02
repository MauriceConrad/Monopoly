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
