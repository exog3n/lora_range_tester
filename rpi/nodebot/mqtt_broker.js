const broker = function() {
  var mosca = require('mosca');

  var settings = {
    type: 'mqtt',
    json: false,
    mqtt: require('mqtt'),
    // host: '127.0.0.1',
    port: 1883
  };

  var server = new mosca.Server(settings);

  server.on('clientConnected', function(client) {
    console.log('client connected', client.id);
  });

  // fired when a message is received
  server.on('published', function(packet, client) {
    // console.log('Published', packet.payload);
  });

  server.on('ready', setup);

  // fired when the mqtt server is ready
  function setup() {
    console.log('Mosca server is up and running');
  }
  return server;
};

const sendMessage = function(server, cmd, data, par) {
  let payload=null;
  let topic=null;
  // console.dir(payload)
  if(cmd=='pose'){
    payload = data[par].toString();
    topic = '/' + cmd+'/'+par+'/'+data.mode;
  }
  else if (cmd=='gps'){
    payload = JSON.stringify(data);
    topic = '/' + cmd;
  }

  var message = {
    topic: topic,
    payload: payload,
    qos: 0, // 0, 1, or 2
    retain: false // or true
  };
  if(payload=='1'){
    console.dir(par+' hand up')
  }
  // console.dir(data)
  server.publish(message, function() {
    // console.log('/' + cmd+'/'+par+'/'+data.mode + ' message sent');
  });
}

module.exports.broker = broker;
module.exports.sendMessage = sendMessage;
