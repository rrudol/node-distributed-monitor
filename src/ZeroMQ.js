const zmq = require('zeromq')

class Publisher {
  constructor(address = 'tcp://127.0.0.1:9312') {
    this.sock = zmq.socket('pub');
    this.sock.bindSync(address);
  }
  broadcast(topic, message) {
    this.sock.send([topic,typeof message === 'object' ? JSON.stringify(message) : message]);
  }
}

function exampleHandler(topic, message) {
  console.log('received a message related to:', topic.toString('utf8'), 'containing message:', message.toString('utf8'));
}

class Subscriber {
  constructor(addresses = ['tcp://127.0.0.1:9312'], topics = ['hello'], callback = exampleHandler) {
    this.sock = zmq.socket('sub');
    addresses.forEach(address => {
      this.sock.connect(address);
    });
    topics.forEach(topic => {
      this.sock.subscribe(topic);
    })
    this.sock.on('message', callback);
  }
}

module.exports = {
  Publisher, Subscriber
}