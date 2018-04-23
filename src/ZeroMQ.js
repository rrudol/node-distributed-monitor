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

    this.subscriptions = new Set();

    this.sock.on('connect', (fd, ep) => {
      // console.log('connect, endpoint:', ep);
      this.subscriptions.add(ep);
    });
    this.sock.on('close', (fd, ep) => {
      this.subscriptions.delete(ep);
    });
    // this.sock.on('connect_delay', function(fd, ep) {console.log('connect_delay, endpoint:', ep);});
    // this.sock.on('connect_retry', function(fd, ep) {console.log('connect_retry, endpoint:', ep);});
    // this.sock.on('listen', function(fd, ep) {console.log('listen, endpoint:', ep);});
    // this.sock.on('bind_error', function(fd, ep) {console.log('bind_error, endpoint:', ep);});
    // this.sock.on('accept', function(fd, ep) {console.log('accept, endpoint:', ep);});
    // this.sock.on('accept_error', function(fd, ep) {console.log('accept_error, endpoint:', ep);});
    // // this.sock.on('close', function(fd, ep) {console.log('close, endpoint:', ep);});
    // this.sock.on('close_error', function(fd, ep) {console.log('close_error, endpoint:', ep);});
    // this.sock.on('disconnect', function(fd, ep) {console.log('disconnect, endpoint:', ep);});

    this.sock.monitor(500, 0);

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