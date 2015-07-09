#include <ELECHOUSE_CC1101.h>
#define MAX_NODES 6
unsigned long lastrx[MAX_NODES+1] = {0}; 
unsigned long elapsed; 
void setup()
{
  Serial.begin(115200);
  Serial1.begin(57600);
  ELECHOUSE_cc1101.Init();
  ELECHOUSE_cc1101.SetDataRate(5); // Needs to be the same in Tx and Rx
  ELECHOUSE_cc1101.SetLogicalChannel(1); // Needs to be the same as receiver
  ELECHOUSE_cc1101.SetTxPower(1);
  ELECHOUSE_cc1101.SetReceive();
}

byte RX_buffer[61]={0};
byte TX_buffer[61]={0};
byte sizerx,i,flag;
byte node_id=0;
// TODO Make loop
// Channel hopping listen:
// Listen on each channel for 100 ms (configurable)
// Log channel info (the most recent maxes and start index) to BT
// Final in transmission is the index, maybe do some dat parsing here
void loop()
{
  for(int i=0;i<MAX_NODES;i++) {
    elapsed = millis();
    ELECHOUSE_cc1101.SetLogicalChannel(i); // Needs to be the same as receiver
    ELECHOUSE_cc1101.SetReceive();
    Serial.print("ID=");
    Serial.println(i);
    while(millis() < elapsed + 120) {
      // Listen 
      if(ELECHOUSE_cc1101.CheckReceiveFlag()) {
        sizerx=ELECHOUSE_cc1101.ReceiveData(RX_buffer);
        Serial.print(RX_buffer[0]);
        Serial.print(",");
        for(int j=1;j<sizerx;j+=2) {
          Serial.print((RX_buffer[j+1] << 8) | RX_buffer[j]);
          Serial.print(",");
        }
        Serial.println();

        // Log data points over bluetooth
        // Send ID, loop index in circular buffer, and then buffer
        Serial1.write(i);
        Serial1.write(i);
        Serial1.write(RX_buffer, 18);
      }
    }
  }
}