const Monitor = require('./Monitor');
let n = 0;
class ProducerConsumerMonitor extends Monitor {
  constructor(config) {
    super(config);
    this.buffer = {
        ...this.buffer,
        n: 0
    }
  }
  async produce(sth) {
    while(this.buffer.n > 5) await this.wait('full storage');
    this.buffer.n += 1;
    n++;
    this.log(`Producing... n = ${this.buffer.n} #${n} bufforVersion=${this.buffer._version}`);
    if(this.buffer.n === 1) this.signal('empty storage');
  }
  async consume(sth) {
    while(this.buffer.n === 0) await this.wait('empty storage');
    this.buffer.n -= 1;
    n++;
    this.log(`Consuming... n = ${this.buffer.n} #${n} bufforVersion=${this.buffer._version}`);
    if(this.buffer.n === 5) await this.signal('full storage');
  }
}

module.exports = ProducerConsumerMonitor;