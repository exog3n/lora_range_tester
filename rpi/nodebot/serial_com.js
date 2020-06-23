const serial = function() {
  const SerialPort = require('serialport');
  const Readline = require('@serialport/parser-readline');


  var settings = {
    baudRate: [9600,38400],
    delimiter: '\n',
    maxLength:32
  };

  // const port_ttn = new SerialPort('/dev/ttyACM0', { baudRate: settings.baudRate[1] });

  const port_uno_drag = new SerialPort('/dev/ttyACM0', { baudRate: settings.baudRate[0] });

  // const port_uno_drag = new SerialPort('/dev/ttyUSB1', { baudRate: settings.baudRate[1] });
  // const port_mega_drag = new SerialPort('/dev/ttyUSB0', { baudRate: settings.baudRate[0] });

  // const parser_ttn = port_ttn.pipe(new Readline({ delimiter: settings.delimiter }));
  const parser_uno_drag = port_uno_drag.pipe(new Readline({ delimiter: settings.delimiter }));
  // const parser_mega_drag = port_mega_drag.pipe(new Readline({ delimiter: settings.delimiter }));

  // Read the port data
  // port_ttn.on("open", () => {
  //   console.log('serial port_ttn open');
  // });
  // port_drag.on("open", () => {
  //   console.log('serial port_drag open');
  // });
  // parser_ttn.on('data', data =>{
  //   console.log('arduino ttn:', data);
  // });
  // parser_drag.on('data', data =>{
  //   console.log('arduino drag:', data);
  // });


  // return [port_ttn,port_drag];
  return [parser_uno_drag];
  // return [parser_mega_drag];
  // return [parser_uno_drag,parser_mega_drag];
};



const sendMessage = function(serial, cmd, pid) {

  console.log(pid)
  // serial.write(pid.toString(), (err) => {
  // serial.write(pid+'\n', (err) => {
  serial.write(Buffer.from(pid+'\n', 'utf8'), (err) => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  });

  serial.on('error', function(err) {
    console.log('Error: ', err.message)
  })

  // Read data that is available but keep the stream in "paused mode"
  serial.on('readable', function () {
    console.log('Data:', port.read())
  })

  // Switches the port into "flowing mode"
  serial.on('data', function (data) {
    console.log('Data:', data)
  })
}
// const sendMessage = function(serial, cmd, data, par) {
//
//   let reduceData = {t:data.lat,n:data.lon};
//   let payload = JSON.stringify(reduceData);
//   console.log(payload)
//   serial.write(payload+'\n', (err) => {
//     if (err) {
//       return console.log('Error on write: ', err.message);
//     }
//   });
// }

module.exports.serial = serial;
module.exports.sendMessage = sendMessage;
