#include <msp430fr5728.h>
#include "cc1101.h"
#include <string.h>
#define SAMPLE_DELAY 10
#define DELAY_BETWEEN 1000
#define MAX_NODES 6

uint8_t tx_buffer[61]={0};
uint8_t rx_buffer[61]={0};
uint16_t v_samples[10]={0};
uint16_t i_samples[5]={0};
volatile uint8_t burstnum,i,flag;
uint16_t sleep_time;
void init_vlo() {
	CSCTL0_H = 0xA5;
	CSCTL1 = DCOFSEL_3; // Set to 8MHz DCO clock
	CSCTL2 = SELA_1 + SELS_3 + SELM_3;        // set ACLK = XT1; MCLK = DCO
	CSCTL3 = DIVA_0 + DIVS_3 + DIVM_3;        // set all dividers, Div by 8 for 1MHz clock speed
}

uint16_t sample_voltage() {
	ADC10CTL0 &= ~ADC10ENC;
	ADC10MCTL0 = ADC10INCH_1 + ADC10SREF_1;
	ADC10CTL0 |= ADC10ENC + ADC10SC;
	while(ADC10CTL1 & ADC10BUSY);
	uint16_t retval = ADC10MEM0;
	if(retval < MAX_NODES) retval = MAX_NODES+1; // The low values are reserved, since they are noise anyway on the ADC
	return retval;
}

uint16_t sample_current() {
	ADC10CTL0 &= ~ADC10ENC;
	ADC10MCTL0 = ADC10INCH_0 + ADC10SREF_1;
	ADC10CTL0 |= ADC10ENC + ADC10SC;
	while(ADC10CTL1 & ADC10BUSY);
	uint16_t retval = ADC10MEM0;
	if(retval < MAX_NODES) retval = MAX_NODES+1; // The low values are reserved, since they are noise anyway on the ADC
	return retval;
}

void smart_load() {
    P1OUT |= BIT2;
    __delay_cycles(SAMPLE_DELAY);
    v_samples[0] = sample_voltage();
    i_samples[0] = sample_current();
    __delay_cycles(DELAY_BETWEEN);
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);

    P1OUT |= BIT3;
    __delay_cycles(SAMPLE_DELAY);
    v_samples[1] = sample_voltage();
    i_samples[1] = sample_current();
    __delay_cycles(DELAY_BETWEEN);
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);

    P1OUT |= BIT4;
    __delay_cycles(SAMPLE_DELAY);
    v_samples[2] = sample_voltage();
    i_samples[2] = sample_current();  
    __delay_cycles(DELAY_BETWEEN);
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);

    P1OUT |= BIT5;
    __delay_cycles(SAMPLE_DELAY);
    v_samples[3] = sample_voltage();
    i_samples[3] = sample_current();
    __delay_cycles(DELAY_BETWEEN);

    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);
    __delay_cycles(SAMPLE_DELAY);
    v_samples[4] = sample_voltage();
    i_samples[4] = sample_current();
    __delay_cycles(DELAY_BETWEEN);
} 

int main(void){
	//Stop watchdog timer
	WDTCTL = WDTPW + WDTHOLD;

	// FET pins for smart laod
	P1DIR |=  BIT2 + BIT3 + BIT4 + BIT5;
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);

	// Configure ADC
	P1SEL0 |= BIT0 + BIT1;
	P1SEL1 |= BIT0 + BIT1;
	ADC10CTL0 |= ADC10ON + ADC10SHT_15;
	ADC10CTL1 |= ADC10DIV_0 + ADC10SHP;
	ADC10CTL2 |= ADC10RES; // 10-bit results

	// Setup timer
	init_vlo();

	// Sleep
	sleep_time = 100;

	// By default, REFMSTR=1 => REFCTL is used to configure the internal reference
	while(REFCTL0 & REFGENBUSY);              // If ref generator busy, WAIT                                          
	REFCTL0 |= REFVSEL_0+REFON;               // Select internal ref = 1.5V, Internal Reference ON   
	__delay_cycles(1000);                      // ref delay  

	Radio.Init();	
	Radio.SetDataRate(5); // Needs to be the same in Tx and Rx
	Radio.SetLogicalChannel(1); // Needs to be the same in Tx and Rx	
	Radio.SetTxPower(0);
	//Radio.Sleep();

	// Sync bytes for the device ID, first four bytes in a BT notification must be the same, and under 10
	tx_buffer[0] = DEVICE_ID;
	tx_buffer[1] = DEVICE_ID;
	tx_buffer[2] = DEVICE_ID;
	tx_buffer[3] = DEVICE_ID;
	while(1) {	
		//Radio.Idle();
		// Gather samples
		//smart_load();
		//for(uint8_t i=0;i<8;i++) {
			//v_samples[i] = sample_voltage();
			//__delay_cycles(SAMPLE_DELAY);
		//}
		//memcpy(&tx_buffer[4], v_samples, 16);
		
		// Send Samples
		Radio.SendData(tx_buffer,61);
		__delay_cycles(1000);
	/*	Radio.RxOn();
		while(!Radio.CheckReceiveFlag());
		Radio.ReceiveData(rx_buffer);	
		__delay_cycles(1000000);
		//Radio.SendData(tx_buffer,20);
		/*		if(rx_buffer[0] == DEVICE_ID && rx_buffer[1] == DEVICE_ID) {
					sleep_time = (rx_buffer[2] << 8) + rx_buffer[3];
					break;
				}
			}
		}*/
		//Radio.Sleep();


	}
	return 1;
}
