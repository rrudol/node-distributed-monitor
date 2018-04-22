const uniqid = require('uniqid');
const {Publisher, Subscriber} = require('./ZeroMQ');

let debug = 0;

// Utility function, which replace all object methods new one
function overrideMethods(obj, newMethod) {
  for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
    const method = obj[name];
    if(name === 'constructor') continue;
    obj[name] = ( async (...args) => {
      await newMethod.call(obj, method, ...args);
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
    this.name = '';
    this._requestCounter = 0;

    // Initialize ZeroMQ Subscriber
    new Subscriber(peers, ['peer', 'ask for critical section', `cs ${this._id}`, 'signal'], this.onMessage.bind(this));
    // Initialize ZeroMQ Publisher
    this._publisher = new Publisher(`tcp://${ip}:${port}`);

    // Force to run `enterCriticalSection` method before and `leaveCriticalSection` after child object method
    overrideMethods(this, function (method, ...args){
      this.lock()
        .then( method.bind(this, ...args) )
        // .then( this.leaveCriticalSection.bind(this) )
    });
  }
  // Utility method for debugging
  log(comment, debugging) {
    if(!debugging) {
      console.log(`${this._id}: ${comment}`);
    }
  }
  // Broadcast message to all peers
  broadcast(topic, message) {
    // this.log(`SEND ${topic}: ${JSON.stringify(message)}`)
    this._publisher.broadcast(topic, message);
  }
  // Handle received message
  onMessage(topic, message) {
    // Decode received message
    topic = topic.toString('utf8');
    message = JSON.parse(message.toString('utf8'));

    if (topic === 'ask for critical section') {
      const request = this._requests[0];
      if (request && (request.timestamp < message.timestamp)
        || request && ((request.timestamp === message.timestamp) && (hashCode(request.id) > hashCode(message.id)))) {
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
        const buf = JSON.stringify(this.buffer);
        this.log(`I'm in! ${JSON.stringify(request)}`, true);
        debug++;
        if(debug>2) {
          console.log(JSON.stringify(this._requests, null, 2));
          console.log(JSON.stringify(this._locks, null, 2));
          console.log(JSON.stringify(this.buffer, null, 2));
        }
        request.resolve().then( () => {
          if( JSON.stringify(this.buffer) !== buf ) {
            this.buffer._version += 1;
          }
          this.unlock(message.id);
        });
      }
    } else if (topic === 'signal') {
      const lock = this._locks.filter(lock => lock.conditionalVariable === message.conditionalVariable)[0];
      if(lock) {
        // this.log(JSON.stringify(this._locks));
        lock.conditionalVariable = 'delete';
        this._locks = this._locks.filter(lock => lock.conditionalVariable !== 'delete');
        // this.log(JSON.stringify(this._locks));
        this.lock(lock.resolve);
      }
    } else {
      this.log(`Received unhandled message '${topic}: ${JSON.stringify(message)}'`)
    }
  }
  wait(conditionalVariable) {
    this.log(`waiting ${this.name} ${JSON.stringify(this.buffer)}`, true);
    return new Promise((resolve, reject) => {
      const lock = { conditionalVariable, resolve: () => { /*this.log(`wait resolved ${this.name} ${JSON.stringify(this.buffer)}`); */resolve(); }, reject };
      this._locks.push(lock);
    });
  }
  signal(conditionalVariable) {
    this.broadcast('signal', {conditionalVariable});
  }
  lock(r) {
    return new Promise((resolve, reject) => {
      const criticalSectionRequest = {
        id: this._id + this._requestCounter++,
        peerId: this._id,
        queue: [],
        timestamp: +(new Date),
        // Need conformation from each peer
        conformationNeeded: this._peers.length,
        resolve: async () => { if(r) await r(); await resolve(); },
        reject
      };
      this._requests.push(criticalSectionRequest);
      this.broadcast('ask for critical section', criticalSectionRequest);
    });
  }
  unlock(requestId) {
    this.log(`I'm out!`, true);
    debug--;
    const request = this._requests.filter(request => request.id === requestId)[0];
    this._requests = this._requests.filter(request => request.id !== requestId);
    request.queue.forEach(message => this.allow(message));
  }
  allow(message) {
    this.broadcast(`cs ${message.peerId}`, { id: message.id, buffer: this.buffer });
  }
}

module.exports = Monitor;