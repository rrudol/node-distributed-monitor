const ProducerConsumerMonitor = require('./src/ProducerConsumerMonitor');

Array(6).fill().forEach( (e, i) => {
  const w = new ProducerConsumerMonitor({
    peers: [
      'tcp://192.168.1.3:9312',
      'tcp://192.168.1.3:9313',
      'tcp://192.168.1.3:9314',
      'tcp://192.168.1.3:9315',
      'tcp://192.168.1.3:9316',
      'tcp://192.168.1.3:9317'
      // 'tcp://150.254.45.138:9312',
      // 'tcp://150.254.45.138:9313',
      // 'tcp://150.254.45.138:9314',
      // 'tcp://150.254.45.138:9315',
      // 'tcp://150.254.45.138:9316'
    ],
    port: 9312 + i
  });

  setTimeout( () => {
    i % 2 ? w.produce('Something...') : w.consume('Something...');
  }, Math.random() * 2000 + 1000);

  // Array(3).fill().forEach( (e, i) => {
  //   i % 2 ? w.produce('Something...') : w.consume('Something...');
  // });
});

// async function write() {
//   console.log(1);
//   await wait();
//   c("7")
// }

// let rozdziabaj;
// function wait() {
//   console.log(2);
//   return new Promise((resolve, reject) => {
//     console.log(3);
//     c("4")
//     rozdziabaj = resolve;
//   });
//   console.log(5);
// }

// let x = 0;
// function c(e) {
//   if(e) console.log(e);
//   x += 1;
//   if(x === 10) {
//     rozdziabaj();
//   }
// }

// write();

// console.log(6);

// setInterval(c, 0);