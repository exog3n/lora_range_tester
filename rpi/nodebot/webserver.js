exports.webServer = function() {

  var http = require('http').createServer(handler); //require http server, and create server with function handler()
  var https = require('https');
  var fs = require('fs'); //require filesystem module

  var path = require('path');
  var express = require('express');
  var app = express();
  app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
  });

  // app.get('/jquery.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/jquery.js'));
  // });
  // app.get('/leaflet.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/leaflet.js'));
  // });
  app.get('/socket.io.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/socket.io.js'));
  });

  app.get('/payloads.json', function(req, res) {
    res.sendFile(path.join(__dirname + '/payloads.json'));
  });

  // app.get('/lib/tf.min.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/lib/tf.min.js'));
  // });
  //
  // app.get('/lib/posenet.min.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/lib/posenet.min.js'));
  // });
  //
  // app.get('/lib/dat.gui.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/lib/dat.gui.js'));
  // });
  //
  // app.get('/camera.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/camera.js'));
  // });
  //
  // app.get('/demo_util.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/demo_util.js'));
  // });

  // app.get('/posenet.js', function(req, res) {
  //   res.sendFile(path.join(__dirname + '/posenet.js'));
  // });

  app.get('/nodebot.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/nodebot.js'));
  });
  app.get('/data_map.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/data_map.js'));
  });
  app.get('/ttn_app_server.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/ttn_app_server.js'));
  });
  app.get('/lora_node.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/lora_node.js'));
  });


  // load web server with socket.io
  // const mosca = require('./mqtt_broker.js');
  // let iotServer = mosca.broker();

  const serialport = require('./serial_com.js');
  let ports = serialport.serial();
  // console.log(ports[0])
  // console.log(ports[1])

  const ttn_client = require('./ttn_app_server.js');
  let lora_client = ttn_client.lora_server();

  const lora_node = require('./lora_node.js');

  // var server = https.createServer({
  //   key: fs.readFileSync('./example.key'),
  //   cert: fs.readFileSync('./example.crt'),
  //   requestCert: false,
  //   rejectUnauthorized: false
  // }, handler);
  var server = https.createServer({
      key: fs.readFileSync('./example.key'),
      cert: fs.readFileSync('./example.crt'),
      requestCert: false,
      rejectUnauthorized: false
    }, app)
    .listen(8080, function() {
      console.log('Example app listening on port 8080! Go to https://localhost:8080/')
    })

  server.listen(8080); //listen to port 8080
  var io = require('socket.io').listen(server);

  function handler(req, res) { //create server
    fs.readFile(__dirname + '/index.html', function(err, data) { //read file index.html in public folder
      if (err) {
        res.writeHead(404, {
          'Content-Type': 'text/html'
        }); //display 404 on error
        return res.end("404 Not Found");
      }
      res.writeHead(200, {
        'Content-Type': 'text/html'
      }); //write HTML
      res.write(data); //write data from index.html
      return res.end();
    });
  }

  // const commands = ['pose', 'gps'];
  // let fc = 0;

  // simple socket.io
  io.sockets.on('connection', function(socket) { // WebSocket Connection
    let prvData = null;
    socket.on('pose', function(data) { //get light intensity status from client
      prvData = resController('pose', data, prvData);
    });
    socket.on('gps', function(data) {
      prvData = resController('gps', data, prvData);
    });
  });

  function resController(cmd, data, prvData) {
    let curData = data;
    if (curData) {
    // if (curData && prvData) {
    //   if (curData!= 'null' && !isEquivalent(curData, prvData)) {
        // mosca.sendMessage(iotServer, commands[fc], curData, 'l');
        // mosca.sendMessage(iotServer, commands[fc], curData, 'r');
        // if(cmd=='pose'){
        //   mosca.sendMessage(iotServer, cmd, curData, 'l');
        //   mosca.sendMessage(iotServer, cmd, curData, 'r');
        // }else if (cmd=='gps')
          // mosca.sendMessage(iotServer, cmd, curData);


          if(curData.dev == 'Arduino'){
            // serialport.sendMessage(ports[0], cmd, curData);
            // serialport.sendMessage(ports[1], cmd, curData);
          }
          if(curData.dev == 'Raspberry'){
            lora_node.sendMessage(cmd, curData.pid); // send payload from rpi dragino
          }


        return curData;
      }
    //   }
    // }
    // return prvData;
  }

  // check for new payloads from cloud
  const axios = require('axios');
  let cloudPayloadsLength = 0;
  let payloadsLocalStore = [];
  setInterval(()=>{
    axios.get('http://lora.hmu.gr:5000/payloads/uplinks')
      .then(response => {
        let payloads = response.data.sort((a,b)=>{return new Date(a.payload.received_at).getTime() - new Date(b.payload.received_at).getTime()});
        // let payloads = response.data.filter(data => Number.isInteger(data.name)).sort((a,b)=>{return b.name - a.name});
        if(payloads.length > cloudPayloadsLength){
          let lastPayload = payloads[payloads.length-1]
          payloadsLocalStore.push(lastPayload);
          cloudPayloadsLength = payloads.length;
          io.sockets.emit('payloads',lastPayload);
          updateJson(payloadsLocalStore);
        }
      })
      .catch(error => {
        // console.log(error);
        console.log('error on request');
      });
  },3000)

  // function isEquivalent(a, b) {
  //   // Create arrays of property names
  //   var aProps = Object.getOwnPropertyNames(a);
  //   var bProps = Object.getOwnPropertyNames(b);
  //
  //   // If number of properties is different,
  //   // objects are not equivalent
  //   if (aProps.length != bProps.length) {
  //     return false;
  //   }
  //
  //   for (var i = 0; i < aProps.length; i++) {
  //     var propName = aProps[i];
  //
  //     // If values of same property are not equal,
  //     // objects are not equivalent
  //     if (a[propName] !== b[propName]) {
  //       return false;
  //     }
  //   }
  //
  //   // If we made it this far, objects
  //   // are considered equivalent
  //   return true;
  // }


  let jsonString = '';
  let historyLoaded = false;

  fs.readFile('payloads.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }
    console.log('File data:', jsonString);
    if(jsonString.length!=0){
      records = JSON.parse(jsonString);
      Object.keys(records).forEach(p=>{records[p].new = false;});
    }
    historyLoaded = true;
  });

  function updateJson(records){
    // let mes = payload.payload_raw.toString();
    // mes = mes.replace("\00","");
    // if(mes.substr(mes.length-1)!='}'){
    //   mes+='}';
    // }

    //let alreadyMessages = Object.values(ttn.payloads).map(p=>{return p.message;});
    // if((!Object.values(ttn.payloads).find(p=>{return p.message == mes && p.dev == payload.dev_id})) && payload.counter > 0){
    //if(alreadyMessages.indexOf(mes) == -1 || (alreadyMessages.indexOf(mes) != -1 && payload.dev_id)){
      // let id = payload.dev_id+'_'+payload.counter;
      // ttn.payloads[id]={"dev":payload.dev_id,"id":payload.counter,"message":mes,"time":payload.metadata.time,"raw":payload, "new":true};
      //TODO write only if there is a new value
      Object.keys(records).forEach(p=>{records[p].new = true;});
      let jsonContent = JSON.stringify(records);
      if(historyLoaded){
        fs.writeFile("payloads.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            // console.log('the new payload is: ', mes);
            console.log("JSON file has been updated.");
        });
      }
    // }
  }




  return io;
};
