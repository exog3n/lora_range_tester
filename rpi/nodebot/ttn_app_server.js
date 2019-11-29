const lora_server = function() {

  //import { data } from "../src"

  var ttn = require("ttn")

  const appID = "lora_range_testing"
  const accessKey = "ttn-account-v2.vcz76MtHfAHLz0yf562DESBxz0E2QYhYvaw6EeLjxpE"

  ttn.data(appID, accessKey)
    .then(function (client) {
      client.on("uplink", function (devID, payload) {
        console.log("Received uplink from ", devID)
        console.log(payload)
      })
    })
    .catch(function (error) {
      console.error("Error", error)
      process.exit(1)
    })

  return ttn;
}
module.exports.lora_server = lora_server;
