#include <ELECHOUSE_CC1101.h>
unsigned long lastrx; 
unsigned long elapsed; 
void setup()
{
  Serial.begin(9600);
  ELECHOUSE_cc1101.Init();
  ELECHOUSE_cc1101.SetDataRate(7); // Needs to be the same in Tx and Rx
  ELECHOUSE_cc1101.SetLogicalChannel(0); // Needs to be the same as receiver
	
  ELECHOUSE_cc1101.SetReceive();
  lastrx=millis();
}

byte RX_buffer[61]={0};
byte size,i,flag;

void loop()
{
  if(ELECHOUSE_cc1101.CheckReceiveFlag())
  {
    lastrx = millis();
    size=ELECHOUSE_cc1101.ReceiveData(RX_buffer);
    Serial.print(lastrx);
    Serial.print(",");
    for(i=0;i<size;i++)
    {
      Serial.print(RX_buffer[i],DEC);
      Serial.print(','); 
    }
    Serial.println("PKT");
    ELECHOUSE_cc1101.SetReceive();
  }
}



