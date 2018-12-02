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
