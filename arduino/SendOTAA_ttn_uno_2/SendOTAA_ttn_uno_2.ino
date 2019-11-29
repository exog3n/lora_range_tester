#include <TheThingsNetwork.h>

const char *appEui = "70B3D57ED0022C28";
const char *appKey = "BCEDFB0E8CCCD9A70ECD323B6D2B08AD";

#define loraSerial Serial1
#define debugSerial Serial

#define freqPlan TTN_FP_EU868

TheThingsNetwork ttn(loraSerial, debugSerial, freqPlan);

const byte DATA_MAX_SIZE = 32;
char data[DATA_MAX_SIZE];   // an array to store the received data
String rpimsg;

void setup()
{
  //Serial.begin(9600);
  loraSerial.begin(57600);
  debugSerial.begin(9600);
    while (!debugSerial && millis() < 10000)
    ;

  debugSerial.println("-- STATUS");
  ttn.showStatus();

  debugSerial.println("-- JOIN");
  ttn.join(appEui, appKey);

  //serial_flush();
}


void loop() {
  static char endMarker = '\n'; // message separator
  byte rpibt[DATA_MAX_SIZE];
  memset(rpibt, 0, sizeof(rpibt));
  Serial.begin(38400);
  if(Serial.available()>0){
      rpimsg = Serial.readStringUntil(endMarker);
      
      rpimsg.getBytes(rpibt, sizeof(rpibt));
      String loramsg = String((char *)rpibt);
      
      Serial.print("payload sent:");
      Serial.println(loramsg);
      Serial.end();

      delay(2000);
      debugSerial.begin(9600);
      if(rpibt[0]!=0){
          ttn.sendBytes(rpibt, sizeof(rpibt));
          serial_flush();
      }
      delay(30000);
      
  }

}

void serial_flush(void) {
  while (Serial.available()) Serial.read();
}
