(function(window) {


  window.refreshRate = 1000;
  window.cycle = 0;
  // window.refreshRate = 100;
  let loc = {
    lat: null,
    lon: null
  };
  let pose = {
    l: null,
    r: null
  };
  let poseData = '';

  var socket = io(); //load socket.io-client and connect to the host that serves the page
  // window.addEventListener("load", function() { //when page loads
  //   var lightbox = document.getElementById("light");
  //   lightbox.addEventListener("change", function() { //add event listener for when checkbox changes
  //     socket.emit("pose", Number(this.checked)); //send button status to server (as 1 or 0)
  //   });
  // });

  window.records = [];

  function Record (devId, pid, data, payload, condition){
    this.devId = devId || 'default';
    this.pid = pid || null;
    this.data = data || null;
    this.payload = payload || null;
    this.condition = condition || 'pending'; // three conditions => pending, success, error
    return this;
  }

  function getLocation(callback) {
    // get user location with html5 geolocation api
    if ("geolocation" in navigator) {
      // check if geolocation is supported/enabled on current browser
      navigator.geolocation.getCurrentPosition(
        function success(position) {
          loc.lat = position.coords.latitude;
          loc.lon = position.coords.longitude;
          callback(loc);
          //console.log('loc',loc);
          // document.getElementById("main").innerHTML='';
          document.getElementById("curLocation").innerHTML='lat: '+loc.lat+'</br>lon: '+loc.lon;
          window.updateMap(loc);
        },

        function error(error_message) {
          // for when getting location results in an error
          console.error('An error has occured while retrieving location', error_message)
        });
    } else {
      // geolocation is not supported
      // get your location some other way
      console.log('geolocation is not enabled on this browser')
    }
  }

  $("#triggerRpi").click(()=>{
    getLocation((l)=>{
      // if (l.lat > 0 && l.lon > 0 && window.cycle>5){
      if (l.lat > 0 && l.lon > 0){
        // socket.emit("gps", {loc:l,cycle:window.cycle});
        let now = new Date();
        let secondsSinceEpoch = Math.round(now.getTime() / 1000); // used as payload id
        window.records.push(new Record('Raspberry',secondsSinceEpoch,{loc:l,cycle:window.cycle})); // TODO start from previous json length
        socket.emit("gps", {pid:secondsSinceEpoch, dev:'Raspberry'});

        updateLog('Location has been sent to NodeBot and will be forwarded immediately to Rpi lora node.' + JSON.stringify(loc));
        console.log('Location has been sent to NodeBot and will be forwarded immediately to Rpi lora node.',loc);
        window.cycle = 0;
      }
    });
    $("#triggerRpi").attr("disabled", true);
    $("#triggerArduino").attr("disabled", true);
    // $("#triggerPing").text("Wait");
    setTimeout(()=>{
      // $("#triggerPing").text("Ping");
      $("#triggerRpi").attr("disabled", false);
      $("#triggerArduino").attr("disabled", false);
    },10000);
    // updateLog('Wait 10 seconds until the next ping.');
    // console.log('Wait 10 seconds until the next ping.')
  })

  $("#triggerArduino").click(()=>{
    getLocation((l)=>{
      // if (l.lat > 0 && l.lon > 0 && window.cycle>5){
      if (l.lat > 0 && l.lon > 0){
        // socket.emit("gps", {loc:l,cycle:window.cycle});
        let now = new Date();
        let secondsSinceEpoch = Math.round(now.getTime() / 1000); // used as payload id
        window.records.push(new Record('Arduino',secondsSinceEpoch,{loc:l,cycle:window.cycle})); // TODO start from previous json length
        socket.emit("gps", {pid:secondsSinceEpoch, dev:'Arduino'});

        updateLog('Location has been sent to NodeBot and will be forwarded immediately to Arduino lora node.' + JSON.stringify(loc));
        console.log('Location has been sent to NodeBot and will be forwarded immediately to Arduino lora node.',loc);
        window.cycle = 0;
      }
    });
    $("#triggerArduino").attr("disabled", true);
    $("#triggerRpi").attr("disabled", true);
    // $("#triggerPing").text("Wait");
    setTimeout(()=>{
      // $("#triggerPing").text("Ping");
      $("#triggerArduino").attr("disabled", false);
      $("#triggerRpi").attr("disabled", false);
    },10000);
    // updateLog('Wait 10 seconds until the next ping.');
    // console.log('Wait 10 seconds until the next ping.')
  })

  let updateLog = function(data){
    let time = (new Date().getUTCHours() - new Date().getTimezoneOffset()/60).toString().padStart(2, "0")+':'+new Date().getMinutes().toString().padStart(2, "0")+':'+new Date().getSeconds().toString().padStart(2, "0");
    $('#payloads').prepend('<li><em><small>'+time+'</small></em> <span><small>'+data+'</small></span></li>')
  }

  socket.on('gps', function(data) {
    updateLog('NodeBot: '+data);
    console.log('NodeBot: ',data);
  });

  socket.on('payloads', function(data) {
    if(data.payload){
      console.log('new payload: ',data);
      let record = records.find((rec)=>{return rec.pid==data.payload.uplink_message.decoded_payload.raw}); // return record based on the message body (pid)
      // let record = records[records.length-1] || {}; // just take the last record
      if(record){
        record.payload = data.payload;
        record.devId = data.payload.end_device_ids.device_id;
        record.condition= 'success';
        socket.emit('record',record);
        // let dataStr = record.devId + ', coords: ' + record.data.loc.lat +','+ record.data.loc.lon + ', gw: ' + record.payload.uplink_message.rx_metadata[0].gateway_ids.gateway_id + ', rssi:' + record.payload.uplink_message.rx_metadata[0].rssi;
        let dataStr = record.devId + ', coords: ' + record.data.loc.lat +','+ record.data.loc.lon + ', gw: ' + record.payload.uplink_message.rx_metadata[0].gateway_ids.gateway_id + ', rssi:' + record.payload.uplink_message.rx_metadata[0].rssi + ', sf: ' + record.payload.uplink_message.settings.data_rate.lora.spreading_factor;
        updateLog(dataStr);
        updateMap(loc, record);
      }
    }
  });



  setInterval(function() {
    // if (window.fc == 0) {
    //   let sideData = getPose('sidelights');
    //   let handsData = getPose('handlights');
    //   socket.emit("pose", sideData);
    //   socket.emit("pose", handsData);
    // } else if (window.fc == 1) {
      // getLocation((l)=>{
      //   // if (l.lat > 0 && l.lon > 0 && window.cycle>5){
      //   if (l.lat > 0 && l.lon > 0){
      //     socket.emit("gps", {loc:l,cycle:window.cycle});
      //     window.cycle = 0;
      //   }
      // });

    // }
    // window.cycle++;
    if ("geolocation" in navigator) {
      // check if geolocation is supported/enabled on current browser
      navigator.geolocation.getCurrentPosition(
        function success(position) {
          loc.lat = position.coords.latitude;
          loc.lon = position.coords.longitude;
          document.getElementById("curLocation").innerHTML='lat: '+loc.lat+'</br>lon: '+loc.lon;
          window.updateMap(loc);
        },

        function error(error_message) {
          console.error('An error has occured while retrieving location', error_message)
        });
    } else {
      console.log('geolocation is not enabled on this browser')
    }
  }, window.refreshRate);
})(window);
