var http = require('http');

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var serialPort = new SerialPort("/dev/cu.usbmodem819771", {
      baudrate: 115200,
      parser: serialport.parsers.readline("\n")
});
serialPort.on("open", function () {
	var data_out = [];
	console.log('open');
	serialPort.on('data', function(data) {
		var data_row = data.trim().split(",").map(function(obj) {return parseInt(obj, 10);});
		data_out.push({id : data_row[0], data : data_row});
		console.log(data_out);
	});

	serialPort.write("ls\n", function(err, results) {
		console.log('err ' + err);
		console.log('results ' + results);
	});

	var server = http.createServer(function(request, response){
		response.setHeader('Access-Control-Allow-Origin', 'null');

		// Request methods you wish to allow
		response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

		// Request headers you wish to allow
		response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

		response.end(JSON.stringify({data : data_out}));
		data_out = [];
	});
	server.listen('8080');
});