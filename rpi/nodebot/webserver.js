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

  app.get('/socket.io.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/socket.io.js'));
  });

  app.get('/payloads.json', function(req, res) {
    res.sendFile(path.join(__dirname + '/payloads.json'));
  });

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

  const serialport = require('./serial_com.js');
  let ports = serialport.serial();
  // console.log(ports[0])
  // console.log(ports[1])

  const ttn_client = require('./ttn_app_server.js');
  let lora_client = ttn_client.lora_server();

  const lora_node = require('./lora_node.js');

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
          if(curData.dev == 'Arduino'){
            // serialport.sendMessage(ports[0], cmd, curData.pid);
            // serialport.sendMessage(ports[1], cmd, curData);
            lora_node.sendArduinoMessage(cmd, curData.pid);
          }
          if(curData.dev == 'Raspberry'){
            lora_node.sendRpiMessage(cmd, curData.pid); // send payload from rpi dragino
          }
        return curData;
      }
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
          io.sockets.on('record',(record)=>{
            console.log(record)
            updateJson(record);
          })
        }
      })
      .catch(error => {
        // console.log(error);
        console.log('error on request');
      });
  },3000)


  let jsonString = '';
  let historyLoaded = false;

  fs.readFile('payloads.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }
    // console.log('File data:', jsonString);
    if(jsonString.length!=0){
      records = JSON.parse(jsonString);
      Object.keys(records).forEach(p=>{records[p].new = false;});
    }
    historyLoaded = true;
  });

  function updateJson(records){
      // Object.keys(records).forEach(p=>{records[p].new = true;});
      let jsonContent = JSON.stringify(records);
      if(historyLoaded){
        fs.writeFile("payloads.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log("JSON file has been updated.");
        });
      }
  }




  return io;
};
