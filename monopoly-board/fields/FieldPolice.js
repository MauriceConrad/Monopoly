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
