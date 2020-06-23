// const webServer = require('./webserver.js');
// let sockets = webServer.webServer();

//
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port_uno_drag = new SerialPort('/dev/ttyACM0' ,{ baudRate: 9600 }, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});
const parser_uno_drag = port_uno_drag.pipe(new Readline({ delimiter: '\n' }));

// let msg = new Buffer('test\n', "binary");
let msg = Buffer.from('test\n', 'utf8');

setTimeout(()=>{
  parser_uno_drag.write(Buffer.from('Hi Mom!'), (err) => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  });
},5000)


parser_uno_drag.on('error', function(err) {
  console.log('Error: ', err.message)
})

// Read data that is available but keep the stream in "paused mode"
parser_uno_drag.on('readable', function () {
  console.log('Data:', port.read())
})

// Switches the port into "flowing mode"
parser_uno_drag.on('data', function (data) {
  console.log('Data:', data)
})
