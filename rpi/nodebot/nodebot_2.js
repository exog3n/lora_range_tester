(function(window) {

  window.refreshRate = 1000;
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
  // socket.on('pose', function(data) { //get button status from client
  //   document.getElementById("light").checked = data; //change checkbox according to push button on Raspberry Pi
  //   socket.emit("pose", data); //send push button status to back to server
  // });

  function getLocation() {
    // get user location with html5 geolocation api
    if ("geolocation" in navigator) {
      // check if geolocation is supported/enabled on current browser
      navigator.geolocation.getCurrentPosition(
        function success(position) {
          loc.lat = position.coords.latitude;
          loc.lon = position.coords.longitude;
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

  function getPose(mode) {
    if (mode == 'sidelights') {
      var roomSize = window.videoSize; // Aka the camera area
      // translate nose position to distance from center of room to left and right
      let roomCenter = roomSize / 2;
      if (window.poses) {
        var roomPos = window.poses[0].keypoints[0].position.x; // pos of the nose
        pose.l = (roomCenter - roomPos).toFixed(0) || 0;
        pose.r = (roomPos - roomCenter).toFixed(0) || 0;
      }
      return {
        l: pose.l,
        r: pose.r,
        mode: mode
      };
    } else if (mode == 'handlights') {
      // console.log(window.poses[0])
      let leftHandUp = false;
      let rightHandUp = false;
      let valueL = null;
      let valueR = null;
      let leftEye = {
        x: window.poses[0].keypoints[1].position.x,
        y: window.poses[0].keypoints[1].position.y
      };
      let rightEye = {
        x: window.poses[0].keypoints[2].position.x,
        y: window.poses[0].keypoints[2].position.y
      };
      let leftShoulder = {
        x: window.poses[0].keypoints[5].position.x,
        y: window.poses[0].keypoints[5].position.y
      };
      let rightShoulder = {
        x: window.poses[0].keypoints[6].position.x,
        y: window.poses[0].keypoints[6].position.y
      };
      let leftWrist = {
        x: window.poses[0].keypoints[9].position.x,
        y: window.poses[0].keypoints[9].position.y
      };
      let rightWrist = {
        x: window.poses[0].keypoints[10].position.x,
        y: window.poses[0].keypoints[10].position.y
      };
      if (leftWrist.x<leftEye.x && leftWrist.x<leftShoulder.x && leftWrist.y<leftEye.y && leftWrist.y<leftShoulder.y){
        // leftHandUp=true;
        valueL=1
        // console.dir("leftHandUp")
      }else{
        // leftHandUp=false;
        valueL=0
      }
      if (rightWrist.x>rightEye.x && rightWrist.x>rightShoulder.x && rightWrist.y<rightEye.y && rightWrist.y<rightShoulder.y){
        // rightHandUp=true;
        valueR=1;
          // console.dir("rightHandUp")
      }else{
        valueR=0;
        // rightHandUp=false;
      }
      return {
        l: valueL,
        r: valueR,
        mode: mode
      };
    }

  }


  setInterval(function() {
    if (window.fc == 0) {
      let sideData = getPose('sidelights');
      let handsData = getPose('handlights');
      socket.emit("pose", sideData);
      socket.emit("pose", handsData);
    } else if (window.fc == 1) {
      getLocation();
      if (loc.lat > 0 && loc.lon > 0)
        socket.emit("gps", loc);
    }
  }, window.refreshRate);
})(window);
