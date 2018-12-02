const { objFillDefaults } = require('./helper');
const { EventEmitter } = require('events');

const Team = require('./Team');

class Monopoly extends EventEmitter {

  constructor(options = {}) {
    super();

    const self = this;

    const opts = objFillDefaults(options, {
      board: {},
      teams: 2,
      wallet: 5000
    });


    opts.board.pieces = opts.teams;
    this.board = new Monopoly.MonopolyBoard(opts.board);

    this.teams = new Array(opts.teams).fill(true).map((value, index) => {
      return new Team(this, index, opts.wallet);
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
