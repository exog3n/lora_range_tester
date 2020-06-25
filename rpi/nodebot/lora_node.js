function sendRpiMessage(cmd, pid) {
  console.log('forward payload: ', pid);
  const execFile = require('child_process').execFile;
  try{
    const child = execFile('/home/pi/raspi-lmic/examples/ttn-otaa/ttn-otaa',[pid], (error, stdout, stderr) => {
      if (error) {
        throw error;
      }
      // console.log(stdout);
    });
  }catch(e){console.log(e)}
}

function sendArduinoMessage(cmd, pid) {
  console.log('forward payload: ', pid);
  const { spawn } = require('child_process');
  const pythonDir = ('/home/pi/nodebot/arduino_serial.py'); // Path of python script folder
  const python = "/usr/bin/python"; // Path of the Python interpreter
  const pyArgs = [pythonDir, pid];
  let result = "";
  let resultError = "";
  try{
    const pyprog = spawn(python, pyArgs);
    // pyprog.stdout.on('data', function(data) {
    //     result += data.toString();
    // });
    //
    // pyprog.stderr.on('data', (data) => {
    //     resultError += data.toString().replace(/Detector is not able to detect the language reliably.\n/g,"");
    // });
  }catch(e){console.log(e)}
}

module.exports.sendRpiMessage = sendRpiMessage;
module.exports.sendArduinoMessage = sendArduinoMessage;
