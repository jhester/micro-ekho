#include <msp430fr5728.h>
#include "cc1101.h"
#include <string.h>
#define SAMPLE_DELAY 10
#define DELAY_BETWEEN 1000
#define SAMPLES 10
#define SAMPLE_SIZE 2
#define RX_BUFFER_SIZE (SAMPLE_SIZE * SAMPLES + 1) 
#define SEND_DELAY_TICKS 1000
#define MAX_NODES 4
#define TOTAL_NETWORK_TIME (MAX_NODES * SEND_DELAY_TICKS)
#define LOOP_TIMES (SAMPLES) // Number of items in array
uint8_t tx_buffer[61]={0};
uint8_t rx_buffer[RX_BUFFER_SIZE]={0};
uint16_t v_samples[SAMPLES]={0};
uint16_t i_samples[SAMPLES]={0};
volatile uint8_t burstnum,i,flag;
uint16_t sleep_time;
uint8_t loop_index;
void init_vlo() {
	CSCTL0_H = 0xA5;
	CSCTL1 = DCOFSEL_3; // Set to 8MHz DCO clock
	CSCTL2 = SELA_1 + SELS_3 + SELM_3;        // set ACLK = XT1; MCLK = DCO
	CSCTL3 = DIVA_0 + DIVS_0 + DIVM_0;        // set all dividers, Div by 1 for 8MHz clock speed
}

uint16_t sample_voltage() {
	//ADC10CTL0 &= ~ADC10ENC;
	//ADC10MCTL0 = ADC10INCH_1 + ADC10SREF_1;
	ADC10CTL0 |= ADC10SC;
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
	//P1DIR |=  BIT2 + BIT3 + BIT4 + BIT5;
    //P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);
    P1DIR &= ~(BIT2 + BIT3 + BIT4 + BIT5);
    //P1DIR &= ~(BIT0 + BIT1);

	// Configure ADC
	P1SEL0 |= BIT1;
	P1SEL1 |= BIT1;
	ADC10CTL0 &= ~ADC10ENC;
	ADC10CTL0 |= ADC10ON + ADC10SHT_0;
	ADC10CTL1 |= ADC10DIV_0 + ADC10SHP;
	ADC10CTL2 |= ADC10RES + ADC10PDIV_0; // 10-bit results
	ADC10MCTL0 = ADC10INCH_1 + ADC10SREF_1;
	ADC10CTL0 |= ADC10ENC;

	// Setup timer
	init_vlo();

	// By default, REFMSTR=1 => REFCTL is used to configure the internal reference
	while(REFCTL0 & REFGENBUSY);              // If ref generator busy, WAIT                                          
	REFCTL0 |= REFVSEL_0+REFON;               // Select internal ref = 1.5V, Internal Reference ON   
	__delay_cycles(1000);                      // ref delay  

	Radio.Init();	
	Radio.SetDataRate(3); // Needs to be the same in Tx and Rx
	Radio.SetLogicalChannel(DEVICE_ID); // Needs to be the same in Tx and Rx	
	Radio.SetTxPower(0);
	Radio.Sleep();
	//tx_buffer[0] = DEVICE_ID; Dont need this since using channel hopping

	// Send samples of past 1s on the channel every 100ms (set 100ms configurable, use VLO clock)
	// So if basestation listens for 100ms (plus pad) on each channel, it will always overhear packet
	// Capture continously on ADC, prioiritizing maximums and minimums (big changes) from p-to-p
	// Keep last MAX_NODES * 100ms of ADC data / maxes, so we lag that much

	// Timer initialization
	TA0CCTL0 = 0;
	TA0CTL = TACLR; // Clear any settings from last time
	TA0CTL |= MC_1 + TASSEL_1 + TAIE; // Up mode, clock source is ACLK (VLO), turn on interrupts
	TA0CCR0 = 65000;

	uint16_t max = 0;
	uint16_t temp = 0;
	while(1) {	
		// Gather samples for 100ms
		// Get the max for this time period
		while(TA0R < SEND_DELAY_TICKS){
			temp = sample_voltage();
			if(temp > max)  {
				max = temp;
			}
		}

		// Clear timer
		TA0CTL |= TACLR; 

		// Prepare samples, manage loop
		v_samples[loop_index] = max;
		max = 0;
		
		// Set loop index
		tx_buffer[0] = loop_index;
		loop_index++;
		if(loop_index >= LOOP_TIMES) {
			loop_index = 0;
		}
		
		memcpy(&tx_buffer[1], v_samples, SAMPLE_SIZE * SAMPLES); 
		
		// Turn on radio
		Radio.Wakeup();
		//__delay_cycles(100);
		Radio.SendData(tx_buffer, RX_BUFFER_SIZE);
		//__delay_cycles(100);
		Radio.Sleep();
	}
	return 1;
}
