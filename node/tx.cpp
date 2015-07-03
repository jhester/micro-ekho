#include <msp430fr5728.h>
#include "cc1101.h"
#include <string.h>

uint8_t tx_buffer[61]={0};
volatile uint8_t burstnum,i,flag;

int main(void){
	//Stop watchdog timer
	WDTCTL = WDTPW + WDTHOLD;
	
	// Create a packet of data
	tx_buffer[0] = 12;
	tx_buffer[1] = 23;
	tx_buffer[2] = 34;	
	delay(1);
	Radio.Init();	
	Radio.SetDataRate(7); // Needs to be the same in Tx and Rx
	Radio.SetLogicalChannel(0); // Needs to be the same in Tx and Rx	
	Radio.SetTxPower(0);
    Radio.Sleep();
	while(1) {		
		
		for(i=0;i<10;i++) {
			Radio.SendData(tx_buffer,10);
			delay(1);
		}
		delay(1);
	}
	return 1;
}
