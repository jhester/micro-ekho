#ifndef CC1101_h
#define CC1101_h

#include <stdint.h>
#include <msp430fr5728.h>
#include "macros.h"
#include "registers.h"


/* ------------------------------------------------------------------------------------------------
 *                                      GDO0 Pin Configuration
 * ------------------------------------------------------------------------------------------------
 */
#define GDO0_BIT__                     5
#define GDO0_PORT__                    J
#define CONFIG_GDO0_PIN_AS_INPUT()       st( INFIX( P, GDO0_PORT__, SEL0 ) &= ~BV(GDO0_BIT__); ) /* clear pin special function default */
#define GDO0_PIN_IS_HIGH()               ( INFIX( P, GDO0_PORT__, IN ) & BV(GDO0_BIT__))


#define GDO0_INT_VECTOR                  INFIX( PORT, GDO0_PORT__, _VECTOR )
#define ENABLE_GDO0_INT()                st( INFIX( P, GDO0_PORT__, IE )  |=  BV(GDO0_BIT__); ) /* atomic operation */
#define DISABLE_GDO0_INT()               st( INFIX( P, GDO0_PORT__, IE )  &= ~BV(GDO0_BIT__); ) /* atomic operation */
#define GDO0_INT_IS_ENABLED()             (  INFIX( P, GDO0_PORT__, IE )  &   BV(GDO0_BIT__) )
#define CLEAR_GDO0_INT_FLAG()            st( INFIX( P, GDO0_PORT__, IFG ) &= ~BV(GDO0_BIT__); ) /* atomic operation */
#define GDO0_INT_FLAG_IS_SET()            (  INFIX( P, GDO0_PORT__, IFG ) &   BV(GDO0_BIT__) )
#define CONFIG_GDO0_RISING_EDGE_INT()    st( INFIX( P, GDO0_PORT__, IES ) &= ~BV(GDO0_BIT__); ) /* atomic operation */
#define CONFIG_GDO0_FALLING_EDGE_INT()   st( INFIX( P, GDO0_PORT__, IES ) |=  BV(GDO0_BIT__); ) /* atomic operation */


/* ------------------------------------------------------------------------------------------------
 *                                      GDO2 Pin Configuration
 * ------------------------------------------------------------------------------------------------
 */
#define GDO2_BIT__                     1
#define GDO2_PORT__                    2
#define CONFIG_GDO2_PIN_AS_INPUT()       st( INFIX( P, GDO2_PORT__, SEL0 ) &= ~BV(GDO2_BIT__); ) /* clear pin special function default */
#define GDO2_PIN_IS_HIGH()               ( INFIX( P, GDO2_PORT__, IN ) & BV(GDO2_BIT__))

#define GDO2_INT_VECTOR                  INFIX( PORT, GDO2_PORT__, _VECTOR )
#define ENABLE_GDO2_INT()                st( INFIX( P, GDO2_PORT__, IE )  |=  BV(GDO2_BIT__); ) /* atomic operation */
#define DISABLE_GDO2_INT()               st( INFIX( P, GDO2_PORT__, IE )  &= ~BV(GDO2_BIT__); ) /* atomic operation */
#define GDO2_INT_IS_ENABLED()             (  INFIX( P, GDO2_PORT__, IE )  &   BV(GDO2_BIT__) )
#define CLEAR_GDO2_INT_FLAG()            st( INFIX( P, GDO2_PORT__, IFG ) &= ~BV(GDO2_BIT__); ) /* atomic operation */
#define GDO2_INT_FLAG_IS_SET()            (  INFIX( P, GDO2_PORT__, IFG ) &   BV(GDO2_BIT__) )
#define CONFIG_GDO2_RISING_EDGE_INT()    st( INFIX( P, GDO2_PORT__, IES ) &= ~BV(GDO2_BIT__); ) /* atomic operation */
#define CONFIG_GDO2_FALLING_EDGE_INT()   st( INFIX( P, GDO2_PORT__, IES ) |=  BV(GDO2_BIT__); ) /* atomic operation */


/* ------------------------------------------------------------------------------------------------
 *                                      SPI Configuration
 * ------------------------------------------------------------------------------------------------
 */

/* CSn Pin Configuration */
#define SPI_CSN_GPIO_BIT__             4
#define SPI_CONFIG_CSN_PIN_AS_OUTPUT()   st( PJDIR |=  BV(SPI_CSN_GPIO_BIT__); )
#define SPI_DRIVE_CSN_HIGH()             st( PJOUT |=  BV(SPI_CSN_GPIO_BIT__); ) /* atomic operation */
#define SPI_DRIVE_CSN_LOW()              st( PJOUT &= ~BV(SPI_CSN_GPIO_BIT__); ) /* atomic operation */
#define SPI_CSN_IS_HIGH()                 (  PJOUT &   BV(SPI_CSN_GPIO_BIT__) )

/* SCLK Pin Configuration */
#define SPI_SCLK_GPIO_BIT__            2
#define SPI_CONFIG_SCLK_PIN_AS_OUTPUT()  st( P2DIR |=  BV(SPI_SCLK_GPIO_BIT__); )
#define SPI_DRIVE_SCLK_HIGH()            st( P2OUT |=  BV(SPI_SCLK_GPIO_BIT__); )
#define SPI_DRIVE_SCLK_LOW()             st( P2OUT &= ~BV(SPI_SCLK_GPIO_BIT__); )

/* SI Pin Configuration */
#define SPI_SI_GPIO_BIT__              6
#define SPI_CONFIG_SI_PIN_AS_OUTPUT()    st( P1DIR |=  BV(SPI_SI_GPIO_BIT__); )
#define SPI_DRIVE_SI_HIGH()              st( P1OUT |=  BV(SPI_SI_GPIO_BIT__); )
#define SPI_DRIVE_SI_LOW()               st( P1OUT &= ~BV(SPI_SI_GPIO_BIT__); )

/* SO Pin Configuration */
#define SPI_SO_GPIO_BIT__              7
#define SPI_CONFIG_SO_PIN_AS_INPUT()     st( P1DIR &= ~BV(SPI_SO_GPIO_BIT__);)
#define SPI_SO_IS_HIGH()                 ( P1IN & BV(SPI_SO_GPIO_BIT__) )

/* SPI Port Configuration */
#define SPI_CONFIG_PORT()                st( P1SEL0 |= BV(SPI_SI_GPIO_BIT__)   |  \
                                                           BV(SPI_SO_GPIO_BIT__); \
                                                  P2SEL0 |= BV(SPI_SCLK_GPIO_BIT__); )

#define SPI_INIT() \
st ( \
  UCB0CTLW0 |= UCSWRST;                           \
  UCB0CTLW0 |= UCSWRST | UCSSEL_2;                 \
  UCB0CTLW0 |= UCCKPH | UCMSB | UCMST | UCSYNC;   \
  UCB0BR0  = 0x02;                                 \
  UCB0BR1  = 0;                                 \
  SPI_CONFIG_PORT();                       \
  UCB0CTLW0 &= ~UCSWRST;                         \
)

/* read/write macros */
#define SPI_WRITE_BYTE(x)                st( UCB0IFG &= ~UCRXIFG;  UCB0TXBUF = x; )
#define SPI_READ_BYTE()                  UCB0RXBUF
#define SPI_WAIT_DONE()                  while(!(UCB0IFG & UCRXIFG));

/* Helper functions */
#define SPI_TURN_CHIP_SELECT_ON()        SPI_DRIVE_CSN_LOW()
#define SPI_TURN_CHIP_SELECT_OFF()       SPI_DRIVE_CSN_HIGH()
#define SPI_CHIP_SELECT_IS_OFF()         SPI_CSN_IS_HIGH()

/* Radio States */
#define RADIO_STATE_UNKNOWN  0
#define RADIO_STATE_OFF      1
#define RADIO_STATE_IDLE     2
#define RADIO_STATE_RX       3

class CC1101Radio {
	private:
		void SpiInit(void);
		uint8_t SpiTransfer(uint8_t value);
		void GDO_Set (void);
		void Reset (void);
		void SpiWriteReg(uint8_t addr, uint8_t value);
		void SpiWriteBurstReg(uint8_t addr, uint8_t *buffer, uint8_t num);
		uint8_t SpiStrobe(uint8_t strobe);
		uint8_t SpiReadReg(uint8_t addr);
		void SpiReadBurstReg(uint8_t addr, uint8_t *buffer, uint8_t num);
		uint8_t SpiReadStatus(uint8_t addr);
		void RegConfigSettings(void);
		void RxModeOff(void);
	public:
		void Init(void);
		void RxOn(void);
		void Idle(void);		
		void Sleep(void);
		void Wakeup(void);
		void SendData(uint8_t *txBuffer, uint8_t size);		
		void SetDataRate(uint8_t rate_ndx);
		void SetTxPower(uint8_t powrset_ndx);
		void SetLogicalChannel(uint8_t channel);
		void SetMaxPacketLength(uint8_t pkt_length);
		uint8_t CheckReceiveFlag(void);
		uint8_t ReceiveData(uint8_t *rxBuffer);
		uint8_t GetState(void);
		int8_t Rssi(void);
};

extern CC1101Radio Radio;

#endif
