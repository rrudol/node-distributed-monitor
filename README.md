# node-distributed-monitor

## Description
Implementation of Distributed Monitor in Node.js. Communication layer is using [ZeroMQ.node](https://github.com/zeromq/zeromq.js/).

### How it works
`Monitor` child classes have all methods wrapped into critical section and share `buffer` field, which could contain any type of field, but have to be stringified into JSON. Each process open socket as a publisher and subscriber, then they listen to each other. There are three types of messages. First is request for critical section, which is broadcast to all process. Every of them send second type of message if it doesn't need access to critical section. In other case, timestamps of their request are compared. Process which send request later, is saved into queue of faster process and give it permission. After collecting permissions from all processes, critical section access is granted. After leaving critical section, process send permissions to all saved in queue. Message with permission contains also buffer version number and if is newer than receiver has, overrides it. That's how processes share buffer object. During processing in critical section process could be stopped by `wait` method. That method required string which could be called conditional variable. Stopped process is waiting for third type of message, which could be send by other process invoking `signal` method, which has same parameter string as `wait` those.

### Summary
This project was especially interesting because of single thread and asynchronous nature of JavaScript. It is probably the only one public implementation of distributed monitor written in Node.js. The only way to stop processing in the middle of critical section was using async/await statement and probably many bad JavaScript programming practices like collecting promise resolvers. Because of C++ bindings of ZeroMQ.node, this project can't be run directly in browsers, but ZeroMQ could be replaces by WebSocket technology, which could make it even more powerful.  
Created as a project for Tools of Distributed Systems classes at [Poznań University of Technology](https://put.poznan.pl)

## Requirements
### Linux
- Node.js 8.11.1 or higher
- Python 2.7
- make
- C/C++ compiler

### MacOS
- Node.js 8.11.1 or higher
- Python 2.7
- Xcode Command Line Tools (MacOS) - Can be installed with `xcode-select --install`

### Windows
- Node.js 8.11.1 or higher
- Windows Build Tools - Can be installed with `npm install -g windows-build-tools`

#### Ubuntu 16.04 - Node installation
```
cd ~
curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt-get install nodejs -y
nodejs -v
git clone https://github.com/rrudol/node-distributed-monitor.git
cd node-distributed-monitor
```

## Usage
Before first launch install dependencies via `npm` or `yarn`
```
npm install
```
Create child class of [Monitor.js](https://github.com/rrudol/node-distributed-monitor/blob/master/src/Monitor.js).
For example:
```js
const Monitor = require('./Monitor');

class ProducerConsumerMonitor extends Monitor {
  constructor(config) {
    super(config);
    this.buffer = {
        ...this.buffer
    }
  }
  async produce(sth) {
    while(this.buffer.n > 5) await this.wait('full storage');
    this.buffer.n += 1;
    this.log(`Producing... n = ${this.buffer.n} bufforVersion=${this.buffer._version}`);
    if(this.buffer.n === 1) this.signal('empty storage');
  }
  async consume(sth) {
    while(this.buffer.n === 0) await this.wait('empty storage');
    this.buffer.n -= 1;
    this.log(`Consuming... n = ${this.buffer.n} bufforVersion=${this.buffer._version}`);
    if(this.buffer.n === 5) await this.signal('full storage');
  }
}

module.exports = ProducerConsumerMonitor;
```
Create starting script:
```js
const ProducerConsumerMonitor = require('./src/ProducerConsumerMonitor');

const monitor = new ProducerConsumerMonitor({
  peers: [
    // List of peers
    'tcp://150.254.45.138:9312',
    'tcp://150.254.45.138:9313',
    'tcp://150.254.45.138:9314',
    'tcp://150.254.45.138:9315',
    'tcp://150.254.45.138:9316',
    'tcp://150.254.45.138:9317'
  ],
  port: process.argv[3]
});

monitor.name = process.argv[3] % 2 ? 'producer' : 'consumer';

async function start() {
  let i;
  for (i = 0; i < 10; i++) {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
          monitor.produce('a').then(() => resolve());
          // or
          monitor.consume('a').then(() => resolve());
      }, Math.random() * 500 + 600);
    });
  }
}
start();
```
### Starting
```
node index.js {ip} {port}
```

## Development
To run concurrently many process on single device, add script into package.json like this:
```
  "local": "concurrently \"node index.js 150.254.45.138 9312\" \"node index.js 150.254.45.138 9313\" \"node index.js 150.254.45.138 9314\" \"node index.js 150.254.45.138 9315\" \"node index.js 150.254.45.138 9316\" \"node index.js 150.254.45.138 9317\"",
```
then run it
```
npm run local
```
It's useful for development and testing.