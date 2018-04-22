const uniqid = require('uniqid');
const {Publisher, Subscriber} = require('./ZeroMQ');

// Utility function, which replace all object methods new one
function overrideMethods(obj, newMethod) {
  for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
    const method = obj[name];
    if(name === 'constructor') continue;
    obj[name] = ((...args) => {
      newMethod.call(obj, method, ...args);
    });
  }
}

// http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
function hashCode(str){
  let hash = 0;
  if (str.length == 0) return hash;
  for (i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

class Monitor {
  constructor({ peers = [], ip = process.argv[2], port = 9312}) {
    // Initialization private variables
    this._id = uniqid();
    this._peers = peers;
    this._requests = [];
    this._locks = [];
    this.buffer = { _version: 0 };

    // Initialize ZeroMQ Subscriber
    new Subscriber(peers, ['peer', 'ask for critical section', `cs ${this._id}`, 'signal'], this.onMessage.bind(this));
    // Initialize ZeroMQ Publisher
    this._publisher = new Publisher(`tcp://${ip}:${port}`);

    // Force to run `enterCriticalSection` method before and `leaveCriticalSection` after child object method
    overrideMethods(this, function (method, ...args){
      this.enterCriticalSection()
        .then( method.bind(this, ...args) )
        .then( this.leaveCriticalSection.bind(this) )
    });
  }
  // Utility method for debugging
  log(comment) {
    console.log(`${this._id}: ${comment}`);
  }
  // Broadcast message to all peers
  broadcast(topic, message) {
    this._publisher.broadcast(topic, message);
  }
  // Handle received message
  onMessage(topic, message) {
    // Decode received message
    topic = topic.toString('utf8');
    message = JSON.parse(message.toString('utf8'));

    if (topic === 'ask for critical section') {
      //if (message.peerId === this._id) return;
      const request = this._requests[0];
      if (request && (request.timestamp < message.timestamp)
        || request && ((request.timestamp === message.timestamp) && (hashCode(request.id) > hashCode(message.id)))) {
        // this.log(`queue ${JSON.stringify(this._requests[0].queue)}`);
        request.queue.push(message);
      } else {
        this.allow(message);
      }
    } else if (topic === `cs ${this._id}`) {
      const request = this._requests.filter(request => request.id === message.id)[0];
      if(this.buffer._version < message.buffer._version) {
        this.buffer = message.buffer;
      }
      request.conformationNeeded -= 1;
      if (request.conformationNeeded === 0) {
        (async () => {
          const buf = JSON.stringify(this.buffer);
          await request.resolve();
          if( JSON.stringify(this.buffer) !== buf ) {
            this.buffer._version += 1;
          }
          // this.buffer._version += 1;
          // this.log('budzimy sie');
          this._requests = this._requests.filter(request => request.id !== message.id);
          request.queue.forEach(message => this.allow(message));
        })();
      }
    } else if (topic === 'signal') {
      this._locks.forEach(lock => {
        if(lock.conditionalVariable === message.conditionalVariable) {
          this.lock(lock.resolve);
        }
      });
    } else {
      this.log(`Received unhandled message '${topic}: ${JSON.stringify(message)}'`)
    }
  }
  enterCriticalSection() {
    this.log('entering critical section');
    return this.lock();
  }
  leaveCriticalSection() {
    this.log('leaving critical section');
    // this.log(JSON.stringify(this.buffer));
    return new Promise((resolve, reject) => {
      // setTimeout(() => {
        resolve()
      // }, 1000);
    });
  }
  wait(conditionalVariable) {
    this.log('waiting');
    return new Promise((resolve, reject) => {
      const lock = { conditionalVariable, resolve, reject };
      this._locks.push(lock);
    });
  }
  signal(conditionalVariable) {
    this.broadcast('signal', {conditionalVariable});
  }
  lock(r) {
    return new Promise((resolve, reject) => {
      const criticalSectionRequest = {
        id: this._id + uniqid(),
        peerId: this._id,
        queue: [],
        // Need conformation from each peer
        conformationNeeded: this._peers.length,
        resolve: async () => { if(r) await r(); await resolve(); },
        reject
      };
      this._requests.push(criticalSectionRequest);
      this.broadcast('ask for critical section', criticalSectionRequest);
    });
  }
  allow(message) {
    this.broadcast(`cs ${message.peerId}`, { id: message.id, buffer: this.buffer });
  }
}

module.exports = Monitor;