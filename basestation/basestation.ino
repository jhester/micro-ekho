#include <ELECHOUSE_CC1101.h>
unsigned long lastrx; 
unsigned long elapsed; 
void setup()
{
  Serial.begin(115200);
  Serial1.begin(57600);
  ELECHOUSE_cc1101.Init();
  ELECHOUSE_cc1101.SetDataRate(4); // Needs to be the same in Tx and Rx
  ELECHOUSE_cc1101.SetLogicalChannel(0); // Needs to be the same as receiver
	
  ELECHOUSE_cc1101.SetReceive();
  lastrx=millis();
}

byte RX_buffer[61]={0};
byte size,i,flag;

void loop()
{
  //Serial1.write("Hello World");
  for(i=1;i<6;i++) {
    RX_buffer[0] = i;
    RX_buffer[1] = i;
    RX_buffer[2] = i;
    RX_buffer[3] = i;    
    RX_buffer[4] = 6+random(249);
    RX_buffer[5] = random(3);    
    Serial1.write(RX_buffer, 20);
    delay(10);
  }
/*  if(ELECHOUSE_cc1101.CheckReceiveFlag())
  {
    lastrx = millis();
    size=ELECHOUSE_cc1101.ReceiveData(RX_buffer);
    Serial.print(RX_buffer[0]); // ID,data_voltage,data_current
    Serial.print(",");
    for(i=1;i<size;i+=2)
    {
      Serial.print(((RX_buffer[i+1] << 8) | RX_buffer[i]),DEC);
      Serial.print(','); 
    }
    Serial.println();
    Serial1.write(RX_buffer, size);
    ELECHOUSE_cc1101.SetReceive();
  }*/ 
}



