Micro Ekho
========


#### Summary
Micro Ekhos are simply miniature, battery powered, deployable versions of [Ekho](https://github.com/jhester/ekho) that can be put placed in energy environments of interest for extended periods of time. They transmit IV curve data over a Sub 1GHz frequency to a basestation, that collects and forwards to a desktop, a phone, or stores all data to an SD card.

This repo holds the hardware files, firmware (basestation, and node), mobile app viewing software (iOs, Android) and desktop viewing software, for Micro Ekho devices.

#### What is Ekho?
Ekho is a energy environment recorder, and emulator for the Internet of Things. It lets scientists and developers who work with tiny, batteryless, energy harevsting devices (think solar panels, piezos, peltier, RFID) have a repeatable testing environment. Without Ekho, verifying functionality for certain energy conditions, is impossible.

Our paper, "Ekho: Realistic and Repeatable Experimentation for Tiny Energy-Harvesting Sensors" describes the design and evaluation of a new tool for recording and replaying energy harvesting conditions. Energy harvesting is a necessity for many small, embedded sensing devices, that must operate maintenance-free for long periods of time. However, understanding how the environment changes and it's effects on device behavior has always been a source of frustration. Ekho allows system designers working with ultra low power devices, to realistically predict how new hardware and software configurations will perform before deployment. By taking advantage of electrical characteristics all energy sources share, Ekho is able to emulate many different energy sources (e.g., Solar, RF, Thermal, and Vibrational) and takes much of the guesswork out of experimentation with tiny, energy harvesting sensing systems.

This paper received the BEST PAPER Award at the 12th ACM Conference on Embedded Networked Sensor Systems (SenSys 2014).

For more information on the concept, design, and evaluation of Ekho, checkout [my website](http://josiahhester.comr).


#### Contents
The "basestation" aggregates the data from multiple "nodes," then sends this to the client application (which can be on a phone, tablet, or desktop) or logs to an SD card. Embedded C on a Teensy ARM chip.

The "desktop" folder contains an electron app that displays the data gathered.

The "hardware" folder contains all the EAGLE files for the micro ekho hardware.

The "mobile" renders the aggregate data on a screen, in real time. Written with apache cordova, HTML, CSS, JavaScript.

The "node" folder holds all the code for the Micro Ekho nodes that are attached to energy harvesters. These nodes send IV data to the "basestation" over the radio. Embedded C on an MSP430.

### Getting Started
Currently, this project is very much in progress, please contact me for more information, or raise an Issue.

#### License
Except for the desktop application made with Electron, everything else is MIT.

The MIT License (MIT)
Copyright (c) 2016 Josiah Hester

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.