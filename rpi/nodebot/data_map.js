let rmap;
let mypos;
// the succesfull transmisions that get from the service
let trsP = [];
let trsD = [];

(function(window) {
  rmap = L.map('rangeMap').setView([35.329220, 25.138660], 12);
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.satellite',
    accessToken: 'pk.eyJ1IjoiZXhvZzNuIiwiYSI6ImNrMTBrMDQ2MDA2ZDkzYnBiemJwcHI4ZXEifQ.R8cibK5ZP0O18_aqgkJ5iA'
  }).addTo(rmap);
  rmap.invalidateSize();

})(window);
function readRemoteData(){

  return data[data.length-1];
}

function getTrs(data){
    let lastData = readRemoteData();
    if(data.length == 0 || data[data.length-1] != lastData){   // IT is asynchronous so?
      trsD.push(lastData);
      return lastData;
    }
    return null;
}

window.updateMap = function(position) {

  let newTr = getTrs(trsD);

  // the gateway marker
  //let marker = L.marker([gw.lat, gw.lon]).addTo(rmap);

  map.removeLayer(mypos);
  mypos = L.circle([position.lat, position.lon], {
    color: 'red',
    fillColor: 'red',
    fillOpacity: 0.5,
    radius: 10
  }).addTo(rmap);
  mypos.bindPopup("<b>Details</b><br>nodes").openPopup();

  if(newTr){
    trsP.push(L.circle([newTr.lat, newTr.lon], {
      color: 'green',
      fillColor: 'green',
      fillOpacity: 0.5,
      radius: 20
    }).addTo(rmap)).bindPopup("<b>Transmission</b><br>Line of sight, spreading factor, airtime, distance.").openPopup();
  }




}
