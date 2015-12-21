var http = require('http');
var server = http.createServer(function(request, response){
	response.setHeader('Access-Control-Allow-Origin', 'null');

	// Request methods you wish to allow
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	var data_out = [
		{id : 0, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 1, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 2, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 0, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 1, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 2, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 0, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 1, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 2, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 0, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 1, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 2, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]},
		{id : 0, voltages : [5,4,3,2,1], currents : [5,4,3,2,1]}
	];
	response.end(JSON.stringify({data : data_out}));
	data_out = [];
});
server.listen('8080');