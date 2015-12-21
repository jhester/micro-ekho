const CURRENT_MULTIPLIER = 1000000; // This puts us in Microamps on Y-AXIS
const YAXIS_LABEL = "Current (µA)";
const ADD_PLOT_AFTER = 100; // Only add a plot after 
const MAX_X = 1.5;
const MIN_X = 0;
$(document).ready(function() {
	var plots = [];
	var new_plot_counter = 0;
	var can_record = false;
	var is_recording = false;
	var timer_interval;
	var current_time = 0;

	function pad_with_zeroes(number, length) {
    	var my_string = '' + number;
    	while (my_string.length < length) {
        	my_string = '0' + my_string;
    	}
    	return my_string;
	}

	function add_iv_plot(ndx, start_data) {
		can_record = true;
        $('#start_stop_recording').prop('disabled', false);
        $('#start_stop_recording').removeClass('btn-disabled');
        $('#start_stop_recording').addClass('btn-default');

		// Add div
		var idstr = 'plot'+ndx;
		$('#plot_container').append('<div class="item-container">'+
			'<input id="'+idstr+'_title" type="text" class="plottitle" placeholder="Plot '+ndx+'"/>'+
			'<div id="'+idstr+'" class="item"></div>'+
			'</div>');

		// Set plot with data
		var plot = $.plot('#'+idstr, [{
			data : start_data,
			points: { show: true, fill: true }}], {
			series: {
				shadowSize: 0	// Drawing is faster without shadows
			},
			yaxis: {
				min: 0,
				max: 60,
				axisLabel: YAXIS_LABEL
			},
			xaxis: {
				min: 0,
				max: 1.5,
				axisLabel: 'Voltage (V)'
			}
		});

		plots[ndx] = plot;
		plots[ndx].draw();
	}

	function update_plot(ndx, data, poly_data) {
		if(!plots[ndx]) {
			add_iv_plot(ndx, data);
		} else {
			plots[ndx].setData([{
				data : data,
				points: { show: true, fill: true },
			},
			{
				data : poly_data,
				lines: { show: true, fill: true },	
			}
			]);
			plots[ndx].draw();
		}
	}

	function poly(x, equation) {
		var result = 0;
		for (var i = 0; i < equation.length; i++) {
			result += equation[i] * Math.pow(x, i);
		};
		return result;
	}

	var electron = require("electron");
	var ipc = electron.ipcRenderer
	const remote = require('electron').remote;
	var dialog = remote.require('dialog');

	// √  Support multiple plots
	// √ Stop and start recording
	// √ When starting recording, must choose save file location 
	// √ Record one file per ekho in (Time,IV-Curve) format
	// √ Add a timer showing how long recording
	// √ Add regression line 
	// Let options be set, mainly for regression line, (choose regression type), and display vals
	// Make data_stream a sub process, and start it from main, add BLE and Ekho to MicroEkho
	// Make work with the 3D surface, using WebGL?

	ipc.on('raw_iv', function(event, data) {
		var deviceid = parseInt(data.deviceid, 10);
		var vs = data.voltage;
		var is = _.map(data.current, function (num) {return num*CURRENT_MULTIPLIER;});
		var plotdata = _.zip(vs, is);
		var poly_current = [];
		var poly_x = [];
		for (var x = _.min(vs); x < _.max(vs); x+=0.05) {
			poly_x.push(x);
			poly_current.push(poly(x, data.regression)*CURRENT_MULTIPLIER);
		};
		update_plot(deviceid, plotdata, _.zip(poly_x, poly_current));
	});

	$('#start_stop_recording').click(function() {
		if(is_recording) {
			$('#start_stop_recording').html('<span class="icon icon-record icon-text" style="color: #009900"></span>Start Recording');
			is_recording = false;
			ipc.send('stop-recording');
			$(':text').prop('disabled', false);
			clearInterval(timer_interval);
			current_time = 0;
			$('#timer').html("00:00:00");
		} else {
			var dirname = dialog.showOpenDialog({ title : 'Choose or create a directory to save IV data...', properties: ['openDirectory', 'createDirectory']});
			if(dirname) {
				// Trigger event on main to record the data as it comes in
				var plots_obj = [];
				for (var i = 0; i < plots.length; i++) {
					if(!plots[i]) continue;
					var plot_obj = {};
					var title = $('#plot'+i+'_title').val();
					if(!title) {
						title = 'plot'+i;
					}
					plot_obj.title = title;
					plot_obj.ndx = i;
					plots_obj.push(plot_obj);
					console.log(plot_obj);
				};
				$(':text').prop('disabled', true);
				ipc.send('start-recording', {dirname : dirname, plots : plots_obj});
				// Update UI
				$('#start_stop_recording').html('<span class="icon icon-stop icon-text" style="color: #dd0000"></span>Stop Recording');
				timer_interval = setInterval(function() {
					current_time++;
					var secs = current_time % 60;
					var mins = parseInt(current_time / 60, 10);
					var hours = parseInt(current_time / 3660, 10);
					$('#timer').html(pad_with_zeroes(hours, 2)+":"+pad_with_zeroes(mins,2)+":"+pad_with_zeroes(secs,2));

				}, 1000)
				// Flag
				is_recording = true;	


			}
			
		}
	})
});