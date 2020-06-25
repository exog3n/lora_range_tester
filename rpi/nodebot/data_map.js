let rmap;
let mypos,gw;
let gwCoords = ['35.317629', '25.102310'];
// the succesfull transmisions that get from the service
let trsP = [];
let trsD = [];
let newTr = null;

(function(window) {
  rmap = L.map('rangeMap').setView([35.329220, 25.138660], 12);
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.satellite',
    accessToken: 'pk.eyJ1IjoiZXhvZzNuIiwiYSI6ImNrMTBrMDQ2MDA2ZDkzYnBiemJwcHI4ZXEifQ.R8cibK5ZP0O18_aqgkJ5iA'
  }).addTo(rmap);
  rmap.invalidateSize();

  drawGw();

  // data saved on rpi from other sessions
  drawJsonData(trsD);

})(window);

function drawGw(newLoc){
  if(newLoc){
    gwCoords = Object.values(newLoc);
  }
  console.log(gwCoords)
  // if (rmap && gw) {
  //   rmap.removeLayer(gw);
  // }
  gw = L.circle([gwCoords[0], gwCoords[1]], {
    color: 'black',
    fillColor: 'white',
    fillOpacity: 1,
    radius: 15
  }).addTo(rmap);
  gw.bindPopup("<b>Gateway</b>");
}

function drawJsonData() {
  $.getJSON("/payloads.json", function(data) {
    console.log('previous json data');
    console.log(data);
      try {
        // Object.values(data).forEach(v => {
        data.forEach(v => {
          // if(!data[k].new){
          // console.log(v)
            trsD.push(v);
            addPoint(v);
          // }

        });
        // console.log(trsD)
    } catch (err) {
      console.log(err)
    }

  });
}

window.updateMap = function(position, record) {
  // let newTr = getTrs(trsD);

  let newTr = (record) ? record : null;
  // the gateway marker
  //let marker = L.marker([gw.lat, gw.lon]).addTo(rmap);
  if (rmap && mypos) {
    rmap.removeLayer(mypos);
  }

  mypos = L.circle([position.lat, position.lon], {
    color: 'red',
    fillColor: 'red',
    fillOpacity: 0.5,
    radius: 2
  }).addTo(rmap);
  // mypos.bindPopup("<b>Details</b><br>nodes").openPopup();

  if(newTr){
    trsD.push(newTr)
    trsP.push(L.circle([newTr.data.loc.lat, newTr.data.loc.lon], {
      color: 'green',
      fillColor: 'green',
      fillOpacity: 0.5,
      radius: 10
    }).addTo(rmap));
    // trsP[trsP.length - 1].bindPopup("<b>Transmission</b><br>Line of sight, spreading factor, airtime, distance.").openPopup();
    trsP[trsP.length - 1].bindPopup("<b>Succesfull Transmission</b><br>Message: "+newTr.payload.uplink_message.decoded_payload.raw+"<br>Device: "+newTr.payload.end_device_ids.device_id+"<br>Fq: "+newTr.payload.uplink_message.settings.frequency+"<br>SF: "+newTr.payload.uplink_message.settings.data_rate.lora.spreading_factor+"<br>BW: "+newTr.payload.uplink_message.settings.data_rate.lora.bandwidth+"<br>Rssi: "+newTr.payload.uplink_message.rx_metadata[0].rssi+"<br>Snr: "+newTr.payload.uplink_message.rx_metadata[0].snr+"<br>Channel Index: "+newTr.payload.uplink_message.rx_metadata[0].channel_index).openPopup();
  }
}

function addPoint(data) {
  // let point = JSON.parse(data.message);
  // console.log(data)
  let point = data.data.loc;
  let dev = data.devId;
  let isNew = data.new;
  // let details = data.payload;
  let detailsHtml = "<b>Succesfull Transmission</b><br>Message: "+data.payload.uplink_message.decoded_payload.raw+"<br>Device: "+data.payload.end_device_ids.device_id+"<br>Fq: "+data.payload.uplink_message.settings.frequency+"<br>SF: "+data.payload.uplink_message.settings.data_rate.lora.spreading_factor+"<br>BW: "+data.payload.uplink_message.settings.data_rate.lora.bandwidth+"<br>Rssi: "+data.payload.uplink_message.rx_metadata[0].rssi+"<br>Snr: "+data.payload.uplink_message.rx_metadata[0].snr+"<br>Channel Index: "+data.payload.uplink_message.rx_metadata[0].channel_index;
  // detailsHtml+= '<h5>'+data.devId+'</h5><p>'+data.pid+'</p>';
  // Object.keys(details.uplink_message.rx_metadata).forEach((k)=>{
  //   let dato = JSON.stringify(details.uplink_message.rx_metadata[k]);
  //   detailsHtml+='<dt>'+k+'</dt><dd>'+dato+'</dd>';
  // })
  let color = (isNew) ? 'orange' : 'yellow';
  // let dColor = (dev == 'ttn_arduino_uno') ? 'green' : 'red';
  if (point.lat && point.lon) {
    trsP.push(L.circle([point.lat, point.lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      radius: 5
    }).addTo(rmap).bindPopup(detailsHtml)
  )}
}
