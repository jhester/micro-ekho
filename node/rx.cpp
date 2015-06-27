#include <msp430fr5739.h>
#include "cc1101.h"

uint8_t RX_buffer[61]={0};
volatile uint8_t sizerx,i,flag;

int main(void){
	//Stop watchdog timer
	WDTCTL = WDTPW + WDTHOLD;
	PJDIR |= BIT0; // Set LED direction, as OUTPUT (Set bit 0 to 1 in PJ Register, (LED))
	PJOUT &= ~BIT0; // Set output to LOW (Send 0 over PIN PJ)
	
	delay(1); // waits 1000 cycles
	Radio.Init(); // start radio (entirely resets radio)
	Radio.SetLogicalChannel(0); // Needs to be the same in Tx and Rx
	Radio.SetDataRate(5); // Needs to be the same in Tx and Rx
	
	Radio.RxOn(); // receive mode active
	while(1) {		
		if(Radio.CheckReceiveFlag()) {	// if buffer has contents then flag returns true.	
			PJOUT ^= BIT0;	// Toggle light LED
			sizerx=Radio.ReceiveData(RX_buffer); // put contents into RX buffer
		}
	}
	return 1;
}
