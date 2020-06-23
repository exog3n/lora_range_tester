import sys
import serial

message = sys.argv[1];
arduinoSerialData = serial.Serial('/dev/ttyACM0',9600)
arduinoSerialData.write(message)
