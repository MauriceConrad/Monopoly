module.exports = {
  generators: [
    team => {
      const steps = Math.randomNumber(1, 12, true);
      return {
        type: "movement",
        wait: true,
        message: "" + team.name + " has to move " + steps + " steps",
        fields: {
          steps: steps
        }
      }
    },
    team => {
      const tax = [25, 50, 100, 200, 300, 400][Math.randomNumber(0, 6, true)];
      return {
        type: "tax",
        wait: false,
        message: "" + team.name + " has to pay $" + tax + " tax",
        fields: {
          tax: tax
        }
      }
    }
  ],
  methods: {
    movement(team, field) {
      return team.move(field.steps);
    },
    tax(team, fields) {
      return team.payTax(fields.tax);
    }
  }
};
