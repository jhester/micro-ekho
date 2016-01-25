#include <ELECHOUSE_CC1101.h>
//#define PRINT_BINARY

unsigned long lastrx; 
unsigned long elapsed;
byte RX_buffer[61]={0};
byte sign_buffer[4]={0};
byte sizerx,i,flag;

void setup()
{
  Serial.begin(115200);
  delay(1000);
  ELECHOUSE_cc1101.Init();
  ELECHOUSE_cc1101.SetDataRate(3); // Needs to be the same in Tx and Rx
  ELECHOUSE_cc1101.SetLogicalChannel(0); // Needs to be the same as receiver
	lastrx=millis();
  ELECHOUSE_cc1101.SetReceive();
}


void loop() 
{
  // Every packet, print out the whole line for rendering
  if(ELECHOUSE_cc1101.CheckReceiveFlag())
  {
    lastrx = millis();
    sizerx=ELECHOUSE_cc1101.ReceiveData(RX_buffer);

#ifdef PRINT_BINARY
    Serial.write(RX_buffer, sizerx);
    Serial.write(sign_buffer, 4);
#endif

#ifndef PRINT_BINARY
    for(i=0;i<sizerx;i++) {
      Serial.print( RX_buffer[i], DEC);
      Serial.print(",");
    }
    Serial.println();
#endif

    ELECHOUSE_cc1101.SetReceive();
  }
}



