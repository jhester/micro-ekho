/** Simply forwards data on the serial port to the electron application */
var SENSE_RESISTOR = 1000;
var I_GAIN = 25;
var V_GAIN = 1;
var V_REF = 1.5;
var ADC_RES = 1024;

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor 
var messenger = require('messenger');

var client = messenger.createSpeaker(8000);
var port = new SerialPort("/dev/cu.usbmodem816861", {
  baudrate: 115200,
  parser: serialport.parsers.readline("\n")
});
var counter = 0;
var data_buffer = [];
port.on("open", function () {
  port.on('data', function(data) {
  	var parsed_data = parse_micro_ekho_packet(data);
  	if(parsed_data === -1) {
  		console.log("Bad packet....");
  	} else {
  		client.send('raw_iv', parsed_data);
  	}
  });
});


function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n) && n != '';
}
/* 	
	Micro Ekho captures 5 IV points per smart load run
 	Each packet has three runs
 	Each point is 4 bytes (2 for V, 2 for I)
 	Arranged like this: [v*5, i*5, v*5, i*5, v*5, i*5] 
 */
var PACKET_LENGTH = 61;
var MAX_NODES = 4;
function parse_micro_ekho_packet(raw_packet) {
  	raw_packet = raw_packet.trim();
  	if(raw_packet[raw_packet.length-1] == ",") {
  		raw_packet = raw_packet.substring(0, raw_packet.length - 1);
  	}
  	var arr = raw_packet.trim().split(",");
  	
  	for(var i=0; i<arr.length; i++) { 
  		arr[i] = parseInt(arr[i], 10); 
  	} 

  	// Check packet length
  	if(arr.length !== 61) return -1; 

  	var deviceid = arr[0];

  	// Check deviceID bounds
  	if(deviceid > MAX_NODES -1) return -1;

	var raw_data = arr.splice(1,60);
	var raw_iv = [];
	for (var i = 0; i < raw_data.length; i+=2) {
		// LSB + (MSB << 8)
		var ndx = parseInt((i == 0) ? 0 : i/2,10);
		raw_iv[ndx] = raw_data[i] + (raw_data[i+1] << 8);
		// Convert from ADC to actual voltage
		raw_iv[ndx] = raw_iv[ndx] * (V_REF / ADC_RES);
	};
	
	var voltage = [];
	var current = [];
	for (var i = 0; i < raw_iv.length; i+=10) {
		voltage.push.apply(voltage, raw_iv.slice(i, i+5));
		current.push.apply(current, raw_iv.slice(i+5, i+10));
	}
	
	var graph_info = {
		deviceid : deviceid,
		voltage : voltage.map(function(num) {return num/V_GAIN;}), // Get actual voltage
		current : current.map(function(num) {return (num/I_GAIN) / SENSE_RESISTOR;}), // Get actual current
	};
//	console.log(graph_info);
	return graph_info;
}