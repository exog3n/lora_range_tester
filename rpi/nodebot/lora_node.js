function sendMessage(cmd, pid) {
  // let reduceData = {
  //   t: data.loc.lat,
  //   n: data.loc.lon
  // };
  // let payload = JSON.stringify(reduceData);
  console.log('pid', pid);

  const execFile = require('child_process').execFile;
  const child = execFile('/home/pi/raspi-lmic/examples/ttn-otaa/ttn-otaa',[pid], (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
    console.log(stdout);
  });
}

module.exports.sendMessage = sendMessage;
