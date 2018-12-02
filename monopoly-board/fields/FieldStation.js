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
