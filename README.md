Micro Ekho
========

This repo holds the firmware, and software, for the Micro Ekho demo.

The "node" folder holds all the code for the Micro Ekho nodes that are attached to energy harvesters. These nodes send IV data to the "basestation" over the radio. Embedded C on an MSP430.

The "basestation" and aggregates the data from multiple "nodes," then sends this to the client application (which can be on a phone, tablet, or desktop). Embedded C on a Teensy ARM chip.

The "client" renders the aggregate data on a screen, in real time. Written with apache cordova, HTML, CSS, JavaScript.