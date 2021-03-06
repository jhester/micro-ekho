/* 
 * Send IV-curves (raw IV points really) over-the-air as fast as possible to anyone listeneing
 * 
 * 
 * 
 * Author: Josiah Hester
 */
#include <msp430fr5728.h>
#include "cc1101.h"
#include <string.h>
#define SAMPLE_DELAY 1600
#define DELAY_BETWEEN 1600
#define SAMPLES 5
#define SAMPLE_SIZE 2
#define BUF_SIZE_BYTES (SAMPLE_SIZE * SAMPLES)
#define RX_BUFFER_SIZE (SAMPLE_SIZE * SAMPLES + 1) 
#define TX_BUFFER_SIZE 61
#define SEND_DELAY_TICKS 1000
#define MAX_NODES 4
#define TOTAL_NETWORK_TIME (MAX_NODES * SEND_DELAY_TICKS)
#define LOOP_TIMES (SAMPLES) // Number of items in array
#define REF_SELECTOR ADC10SREF_1
 
uint8_t tx_buffer[TX_BUFFER_SIZE]={0};
uint8_t rx_buffer[RX_BUFFER_SIZE]={0};
uint16_t v_samples[SAMPLES]={0};
uint16_t i_samples[SAMPLES]={0};
volatile uint8_t burstnum,i,flag;
uint16_t sleep_time;
uint8_t loop_index;

void init_clocks() {
	CSCTL0_H = 0xA5;
	CSCTL1 = DCORSEL + DCOFSEL_3; // Set to 24MHz DCO clock
	CSCTL2 = SELA_1 + SELS_3 + SELM_3;        // set ACLK = VLO; MCLK = DCO
	CSCTL3 = DIVA_0 + DIVS_1 + DIVM_1;        // set all dividers, Div by 1 for 8MHz clock speed
}

uint16_t sample_voltage() {
	ADC10CTL0 &= ~ADC10ENC;
	ADC10MCTL0 = ADC10INCH_1 + REF_SELECTOR;
	ADC10CTL0 |= ADC10ENC + ADC10SC;
	while(ADC10CTL1 & ADC10BUSY);
	uint16_t retval = ADC10MEM0;
	if(retval < MAX_NODES) retval = MAX_NODES+1; // The low values are reserved, since they are noise anyway on the ADC
	return retval;
}

uint16_t sample_current() {
	ADC10CTL0 &= ~ADC10ENC;
	ADC10MCTL0 = ADC10INCH_0 + REF_SELECTOR;
	ADC10CTL0 |= ADC10ENC + ADC10SC;
	while(ADC10CTL1 & ADC10BUSY);
	uint16_t retval = ADC10MEM0;
	if(retval < MAX_NODES) retval = MAX_NODES+1; // The low values are reserved, since they are noise anyway on the ADC
	return retval;
}

void set_gain_high() {
	PJDIR |= BIT0;
	PJOUT |= BIT0;
}

void set_gain_low() {
	PJDIR |= BIT0;
	PJOUT &= ~BIT0;
}

void led_init() {
	PJDIR |= BIT1;
}

void led_on() {
	PJOUT |= BIT1;
}

void led_off() {	
	PJOUT &= ~BIT1;
}

void led_toggle() {	
	PJOUT ^= BIT1;
}

void smart_load_init() {
    P1DIR |= BIT2 + BIT3 + BIT4 + BIT5;
    P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);
}

void smart_load_off() {
	P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);
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

void voltage_load() {
	P1OUT |= BIT5;
    __delay_cycles(SAMPLE_DELAY);
    v_samples[3] = sample_voltage();
    i_samples[3] = sample_current();
    __delay_cycles(DELAY_BETWEEN);
}

void current_load() {
	P1OUT &= ~(BIT2 + BIT3 + BIT4 + BIT5);
    __delay_cycles(SAMPLE_DELAY);
    v_samples[0] = sample_voltage();
    i_samples[0] = sample_current();
    __delay_cycles(DELAY_BETWEEN);
    
}
int main(void){
	uint16_t max = 0, j=0;
	uint16_t temp = 0;
	
	//Stop watchdog timer
	WDTCTL = WDTPW + WDTHOLD;

	// FET pins for smart load all low
	smart_load_init();
	// Set gain on INA225
	//set_gain_low();
	set_gain_high();
	// LED
	led_init();
	// Setup clocks
	init_clocks();
    
	// Configure ADC for V_SENSE and I_SENSE
	P1SEL0 |= BIT1 + BIT0;
	P1SEL1 |= BIT1 + BIT0;
	ADC10CTL0 &= ~ADC10ENC;
	ADC10CTL0 |= ADC10ON + ADC10SHT_0;
	ADC10CTL1 |= ADC10DIV_4 + ADC10SHP;
	ADC10CTL2 |= ADC10RES + ADC10PDIV_0; // 10-bit results
	ADC10MCTL0 = ADC10INCH_1 + REF_SELECTOR;
	ADC10CTL0 |= ADC10ENC;

	// By default, REFMSTR=1 => REFCTL is used to configure the internal reference
	while(REFCTL0 & REFGENBUSY);              // If ref generator busy, WAIT                                          
	REFCTL0 |= REFVSEL_0+REFON;               // Select internal ref = 1.5V, Internal Reference ON   
	__delay_cycles(1000);                      // ref delay  

	// Init results 
	tx_buffer[0] = DEVICE_ID;

	// Radio startup
	Radio.Init();	
	Radio.SetDataRate(3); // Needs to be the same in Tx and Rx
	Radio.SetLogicalChannel(0); // Needs to be the same in Tx and Rx	
	Radio.SetTxPower(0);
	Radio.Sleep();
	
	// Main loop
	while(1) {	
		led_toggle();
    	
		// Get three IV curves to fill up packet
    	for(j=0;j<3;j++) {
    		smart_load();
			memcpy(&tx_buffer[1+BUF_SIZE_BYTES * 2 * j], v_samples, BUF_SIZE_BYTES); 
    		memcpy(&tx_buffer[1+BUF_SIZE_BYTES+BUF_SIZE_BYTES * 2 * j], i_samples, BUF_SIZE_BYTES); 
    	}

    	// Turn on radio, for speed, don't sleep / wakeup
		Radio.Wakeup();
		__delay_cycles(100);
		Radio.SendData(tx_buffer, TX_BUFFER_SIZE);
		Radio.Sleep();
	}
	return 1;
}
