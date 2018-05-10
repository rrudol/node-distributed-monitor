const fetch = require('node-fetch');
const ProducerConsumerMonitor = require('./src/ProducerConsumerMonitor');

fetch('http://sirius.cs.put.poznan.pl/~inf122510/peers.json')
    .then(res => res.json())
    .then(json => run(json));

function run(peers) {

  console.log(peers)

  const monitor = new ProducerConsumerMonitor({
    peers,
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

}