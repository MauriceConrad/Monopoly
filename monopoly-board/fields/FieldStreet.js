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
