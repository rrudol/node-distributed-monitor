const ProducerConsumerMonitor = require('./src/ProducerConsumerMonitor');

const monitor = new ProducerConsumerMonitor({
  peers: [
    // 'tcp://150.254.45.138:9312',
    // 'tcp://150.254.45.138:9313',
    // 'tcp://150.254.45.138:9314',
    // 'tcp://150.254.45.138:9315',
    // 'tcp://150.254.45.138:9316',
    // 'tcp://150.254.45.138:9317',
    'tcp://192.168.1.2:6001',
    'tcp://192.168.1.3:6002',
    // 'tcp://192.168.1.3:9312',
    // 'tcp://192.168.1.3:9313',
    // 'tcp://192.168.1.3:9314',
    // 'tcp://192.168.1.3:9315',
    // 'tcp://192.168.1.3:9316',
    // 'tcp://192.168.1.3:9317'
  ],
  port: process.argv[3]
});

monitor.name = process.argv[3] % 2 ? 'producer' : 'consumer';

setTimeout(() => {

  async function start() {
    let i;
    for (i = 0; i < 10; i++) {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (process.argv[3] % 2) {
            monitor.produce('a').then(() => resolve());
          } else {
            monitor.consume('a').then(() => resolve());
          }
        }, Math.random() * 500 + 600)
      });
    }
    setTimeout(() => {
      console.log('done', monitor.buffer)
    }, 2000);
  }
  start();

}, 1000);