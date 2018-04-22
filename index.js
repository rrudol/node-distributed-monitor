const ProducerConsumerMonitor = require('./src/ProducerConsumerMonitor');

const monitor = new ProducerConsumerMonitor({
  peers: [
    'tcp://192.168.1.3:9312',
    'tcp://192.168.1.3:9313',
    'tcp://192.168.1.3:9314',
    'tcp://192.168.1.3:9315',
    'tcp://192.168.1.3:9316',
    'tcp://192.168.1.3:9317'
  ],
  port: process.argv[3]
});

monitor.name = process.argv[3] % 2 ? 'producer' : 'consumer';

async function start() {
  let i;
  for(i=0;i<100;i++) {
    await new Promise( (resolve, reject) => {
      setTimeout(() => {
        if(process.argv[3] % 2) {
          monitor.produce('a').then( () => resolve() );
        } else {
          monitor.consume('a').then( () => resolve() );
        }
      }, Math.random() * 2000 + 1000)
    });
  }
}

start();


// Array(6).fill().forEach( (e, i) => {
//   const w = new ProducerConsumerMonitor({
//     peers: [
//       'tcp://192.168.1.3:9312',
//       'tcp://192.168.1.3:9313',
//       'tcp://192.168.1.3:9314',
//       'tcp://192.168.1.3:9315',
//       'tcp://192.168.1.3:9316',
//       'tcp://192.168.1.3:9317'
//       // 'tcp://150.254.45.138:9312',
//       // 'tcp://150.254.45.138:9313',
//       // 'tcp://150.254.45.138:9314',
//       // 'tcp://150.254.45.138:9315',
//       // 'tcp://150.254.45.138:9316'
//     ],
//     port: 9312 + i
//   });
//
//   setTimeout( () => {
//     i % 2 ? w.produce('Something...') : w.consume('Something...');
//   }, Math.random() * 2000 + 1000);
//
//   // Array(3).fill().forEach( (e, i) => {
//   //   i % 2 ? w.produce('Something...') : w.consume('Something...');
//   // });
// });

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