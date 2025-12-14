class CartEventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, ...args) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      callback(...args);
    });
  }
}

const cartEventEmitter = new CartEventEmitter();

export const emitCartUpdate = () => {
  cartEventEmitter.emit("cartUpdated");
};

export default cartEventEmitter;

