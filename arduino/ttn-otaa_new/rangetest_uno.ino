#define LORA_SS 10

#include <SPI.h>

#include <lmic.h>
#include <hal/hal.h>

bool loraMessageSent  = false;
bool loraStatusJoined = false;

uint8_t buf[32];

// This EUI must be in little-endian format, so least-significant-byte
// first. When copying an EUI from ttnctl output, this means to reverse
// the bytes. For TTN issued EUIs the last bytes should be 0xD5, 0xB3,
// 0x70.
// static const u1_t PROGMEM APPEUI[8]={ 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02,
// 0xEB, 0x31 };
static const u1_t PROGMEM APPEUI[8] = {0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11};

void os_getArtEui (u1_t* buf) {
  memcpy_P(buf, APPEUI, 8);
}

// This should also be in little endian format, see above.
static const u1_t PROGMEM DEVEUI[8] = {0x35, 0x41, 0x98, 0x12, 0x9C, 0x20, 0x2F, 0x00};
void os_getDevEui (u1_t* buf) {
  memcpy_P(buf, DEVEUI, 8);
}

// This key should be in big endian format (or, since it is not really a
// number but a block of memory, endianness does not really apply). In
// practice, a key taken from ttnctl can be copied as-is.
// The key shown here is the semtech default key.
static const u1_t PROGMEM APPKEY[16] = {0x2B, 0x5E, 0x44, 0x54, 0x60, 0xA1, 0x4C, 0xC9, 0xA9, 0x8C, 0x81, 0x9F, 0x79, 0x20, 0x9C, 0xD8};
void os_getDevKey(u1_t* buf) {
  memcpy_P(buf, APPKEY, 16);
}

static osjob_t sendjob;
void loraSend(osjob_t*);

// Pin mapping
const lmic_pinmap lmic_pins = {
  .nss = 10,
  .rxtx = LMIC_UNUSED_PIN,
  .rst = LMIC_UNUSED_PIN,
  .dio = {2, 6, 7},
};

void onEvent(ev_t ev) {

  switch (ev)
  {
    case EV_SCAN_TIMEOUT:
      Serial.println(F("EV_SCAN_TIMEOUT"));
      break;
    case EV_BEACON_FOUND:
      Serial.println(F("EV_BEACON_FOUND"));
      break;
    case EV_BEACON_MISSED:
      Serial.println(F("EV_BEACON_MISSED"));
      break;
    case EV_BEACON_TRACKED:
      Serial.println(F("EV_BEACON_TRACKED"));
      break;
    case EV_JOINING:
      Serial.println(F("EV_JOINING"));
      break;
    case EV_JOINED:
      Serial.println(F("EV_JOINED"));
      LMIC_setLinkCheckMode(0);
      loraStatusJoined = true ;
      break;
    case EV_RFU1:
      Serial.println(F("EV_RFU1"));
      break;
    case EV_JOIN_FAILED:
      Serial.println(F("EV_JOIN_FAILED"));
      break;
    case EV_REJOIN_FAILED:
      Serial.println(F("EV_REJOIN_FAILED"));
      break;
    case EV_TXCOMPLETE:
      Serial.println(F("EV_TXCOMPLETE (includes waiting for RX windows)"));
      loraMessageSent = true;
      break;
    case EV_LOST_TSYNC:
      Serial.println(F("EV_LOST_TSYNC"));
      break;
    case EV_RESET:
      Serial.println(F("EV_RESET"));
      break;
    case EV_RXCOMPLETE:
      // data received in ping slot
      Serial.println(F("EV_RXCOMPLETE"));
      break;
    case EV_LINK_DEAD:
      Serial.println(F("EV_LINK_DEAD"));
      break;
    case EV_LINK_ALIVE:
      Serial.println(F("EV_LINK_ALIVE"));
      break;
    default:
      Serial.println(F("Unknown event"));
      break;
  }
}
String msg = "";

void setup()
{
  Serial.begin(38400)  ;
  Serial.setTimeout(50);

  os_init();
  delay(10);
}
void loop()
{ 
  if (Serial.available())
  {
    msg = Serial.readString();
    msg.toCharArray(buf, 32) ;
    
    Serial.print("MSG: ");
    Serial.print(msg);
    Serial.println() ;
    loraMessageSent = false;
    loraStatusJoined = false;

    LMIC_reset();
    LMIC_setClockError(MAX_CLOCK_ERROR * 1 / 100);
    LMIC_startJoining();

    while (!loraStatusJoined)
    {
      os_runloop_once();
    }

    Serial.print("JOINED!");
    Serial.println();

    os_setCallback(&sendjob, loraSend);

    while (!loraMessageSent)
    {
      os_runloop_once();
    }

    msg = "";
    msg.toCharArray(buf, 32);
  }
}
void loraSend(osjob_t* _j) {
  if (LMIC.opmode & OP_TXRXPEND)
  {
    Serial.println(F("OP_TXRXPEND, not sending"));
  }
  else
  {
    LMIC_setTxData2(1, buf, sizeof(buf) - 1, 1);
    Serial.print(F("Packet queued: "));
    Serial.print((char*)buf);
    Serial.println();
  }
}
