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

  const lora_node = require('./lora_node.js');

  var server = https.createServer({
      key: fs.readFileSync(path.join(__dirname + '/example.key')),
      cert: fs.readFileSync(path.join(__dirname + '/example.crt')),
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
    console.log('New socket connection')
    let prvData = null;
    socket.on('gps', function(data) {
      socket.emit('reply',data.pid+' received and will be sent to gateway');
      prvData = resController('gps', data, prvData);
    });
    socket.on('record',(record)=>{
      socket.emit('reply',record.pid + ' payload confirmed that was transmitted succesfully');
      records.push(record);
      updateJson(records);
    })
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      // socket.emit('disconnect');
      // io = require('socket.io').listen(server);
    })
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
        }
      })
      .catch(error => {
        // console.log(error);
        console.log('error on request');
      });
  },3000)

  let records = [];
  let jsonString = '';
  let historyLoaded = false;

try{
  fs.readFile(path.join(__dirname + '/payloads.json'), 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }
    console.log('File data:', jsonString);
    if(jsonString.length!=0){
      records = JSON.parse(jsonString);
      // Object.keys(records).forEach(p=>{records[p].new = false;});
      // records.forEach(p=>{records[p]['new'] = false;});
    }
    historyLoaded = true;
  });
}catch(e){
  console.log(e);
}


  function updateJson(records){
      // Object.keys(records).forEach(p=>{records[p].new = true;});
      let jsonContent = JSON.stringify(records);
      if(historyLoaded){
        fs.writeFile(path.join(__dirname + '/payloads.json'), jsonContent, 'utf8', function (err) {
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



  // function updateJson(record){
  //   let oldRecords = {};
  //   fs.readFile('payloads.json', 'utf8', (err, jsonString) => {
  //     if (err) {
  //         console.log("File read failed:", err)
  //         return
  //     }
  //     oldRecords = JSON.parse(jsonString);
  //   });
  //   let jsonContent = JSON.stringify(Object.assign(record, oldRecords));
  //   if(historyLoaded){
  //     fs.writeFile("payloads.json", jsonContent, 'utf8', function (err) {
  //         if (err) {
  //             console.log("An error occured while writing JSON Object to File.");
  //             return console.log(err);
  //         }
  //         console.log("JSON file has been updated.");
  //     });
  //   }
  // }
