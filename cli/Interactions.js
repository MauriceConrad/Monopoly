var readline = require('readline');

if (!("Interface" in readline)) {
  readline = require("./readline-browser-polyfill");
  
}

module.exports = class Interactions {
  constructor() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {

      if (key.ctrl && key.name === 'c') {
        //process.exit();
      }
      else {
        const emittedInteraction = (() => {
          for (let interaction of this.list) {
            if (interaction.keys.includes(key.name)) {
              return interaction;
            }
          }
        })();
        if (emittedInteraction) {
          emittedInteraction.callback(key);
        }
      }
    });

    this.list = [];

  }
  add(interaction) {
    const newInteraction = new Interaction(interaction);
    this.list.push(newInteraction);
    return newInteraction;
  }
  /*remove(interactionObj) {
    this.list = this.list.filter(interaction => interaction != interactionObj);

  }*/
  remove(...interactionsRemove) {
    this.list = this.list.filter(interaction => !interactionsRemove.includes(interaction));
  }
  removeByProperty(propertyName, value, multiple = false) {
    this.list = this.list.filter(interaction => interaction[propertyName] != value);
  }
};

class Interaction {
  constructor(interactionProto) {
    this.appendProperties(interactionProto);
  }
  get text() {
    return this.description + " " + this.keys.map(keyName => "[" + keyName.toUpperCase() + "]").join(" ");
  }
  appendProperties(interactionProto) {
    for (let propName in interactionProto) {
      if (interactionProto.hasOwnProperty(propName)) {
        this[propName] = interactionProto[propName];
      }
    }
  }
}
