# node-distributed-monitor

## Description
Implementation of Distributed Monitor in Node.js. Communication layer is using [ZeroMQ.node](https://github.com/zeromq/zeromq.js/).
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

### Testing
```
npm test
```
