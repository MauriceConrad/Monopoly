module.exports = {
  emitKeypressEvents() {

  },
};
window.addEventListener("keydown", event => {
  const keyNames = {
    "ArrowUp": "up",
    "ArrowDown": "down",
    "ArrowRight": "right",
    "ArrowLeft": "left"
  };
  const keypressKeyDescriptor = {
    ctrl: event.ctrlKey,
    name: event.key in keyNames ? keyNames[event.key] : event.key
  };
  process.stdin.emit("keypress", "", keypressKeyDescriptor);
});
process.stdin = {
  setRawMode() {
    console.log("Setted raw mode...");
  },
  eventListeners: {},
  on(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
  },
  emit(eventName, ...args) {
    for (let listener of this.eventListeners[eventName]) {
      listener(...args);
    }
  }

};
process.stdout = {
  write(text) {
    if (window.onWrite) {
      window.onWrite(text);
    }
  }
};
