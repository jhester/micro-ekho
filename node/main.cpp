#include <msp430fr5728.h>
#include "cc1101.h"
#include <string.h>
#define DELAY_BETWEEN 10000

uint8_t tx_buffer[61]={0};
volatile uint8_t burstnum,i,flag;
void smart_load() {
    P1OUT |= BIT2;
    __delay_cycles(DELAY_BETWEEN);
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);

    P1OUT |= BIT3;
    __delay_cycles(DELAY_BETWEEN);
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);

    P1OUT |= BIT4;
    __delay_cycles(DELAY_BETWEEN);
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);

    P1OUT |= BIT5;
    __delay_cycles(DELAY_BETWEEN);
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);
    __delay_cycles(DELAY_BETWEEN);
}

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
	Radio.SetTxPower(5);
	while(1) {		
		for(i=0;i<10;i++) {
			Radio.SendData(tx_buffer,10);
			delay(1);
		}
		delay(50);
	}
	return 1;
}
