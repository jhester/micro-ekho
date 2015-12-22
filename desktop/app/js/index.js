const CURRENT_MULTIPLIER = 1000000; // This puts us in Microamps on Y-AXIS
const YAXIS_LABEL = "Current (µA)";
const ADD_PLOT_AFTER = 100; // Only add a plot after 
const MAX_X = 1.5;
const MIN_X = 0;
const SMOOTHIE_WIDTH = 630;
$(document).ready(function() {
	var plots = [];
	var new_plot_counter = 0;
	var can_record = false;
	var is_recording = false;
	var can_pause = false;
	var is_paused = false;
	var timer_interval;
	var current_time = 0;

	function pad_with_zeroes(number, length) {
    	var my_string = '' + number;
    	while (my_string.length < length) {
        	my_string = '0' + my_string;
    	}
    	return my_string;
	}

	function myYRangeFunction(range) {
	  // TODO implement your calculation using range.min and range.max
	  var min = 0;
	  var max = range.max;
	  return {min: min, max: max};
	}


	function add_stream_plot(ndx, start_data) {
		var idstr = 'plot'+ndx;
		var stream_idstr = idstr+"_stream"
		var smoothie = new SmoothieChart({
			timestampFormatter:SmoothieChart.timeFormatter,
	        interpolation:'linear',
	        minValue : 0.0,
	        millisPerPixel: 5000 / SMOOTHIE_WIDTH, // ~5s
	        grid:{millisPerLine : 1000, verticalSections:5,fillStyle:'#ffffff',borderVisible:false},
	        labels:{fillStyle:'#000000'},
	        yRangeFunction:myYRangeFunction
	    });

	    $('#'+idstr+'_container').append('<canvas class="streamer" id="'+stream_idstr+'" width="'+SMOOTHIE_WIDTH+'" height="100"></canvas>'+
	    	'<p id="'+idstr+'_yaxislabel" class="rotate90 yaxislabel">Current (µA)</p>'+
	    	'<p class="xaxislabel">Time of day</p>');
	    smoothie.streamTo(document.getElementById(stream_idstr), 150);
	    var line1 = new TimeSeries();
	    smoothie.addTimeSeries(line1, {lineWidth:2,strokeStyle:'#00ff00'});
	    return {plot : smoothie, series : line1, htmlid : stream_idstr};
	}

	function add_iv_plot(ndx, start_data) {
		// Add div
		var idstr = 'plot'+ndx;
		$('#'+idstr+'_container').append('<div id="'+idstr+'" class="item"></div>');

		// Set plot with data
		var plot = $.plot('#'+idstr, [{
			data : start_data,
			points: { show: true, fill: true }}], {
			series: {
				shadowSize: 0	// Drawing is faster without shadows
			},
			yaxis: {
				min: 0,
				max: 10,
				axisLabel: YAXIS_LABEL
			},
			xaxis: {
				min: 0,
				max: 0.75,
				axisLabel: 'Voltage (V)'
			}
		});

		plot.draw();
		return {plot : plot, htmlid : idstr};
	}

	function update_iv(ndx, data, poly_data) {
		var plot = plots[ndx].flot.plot;
		if(poly_data) {
			plot.setData([
			{
				data : data,
				points: { show: true, fill: true },
			},
			{
				data : poly_data,
				lines: { show: true, fill: true },	
			}]);
		} else {
			plot.setData([{
				data : data,
				points: { show: true, fill: true },
			}]);
		}
		plot.draw();
	}
	
	function update_stream(ndx, data) {
		var plot = plots[ndx].smoothie;
		var unzipped = _.unzip(data);
		var v = _.max(unzipped[0]);
		var i = _.max(unzipped[1]);
		var render_data = i;
        switch(plots[ndx].render_type) {
			case "volts":
				render_data = v;
				break;
			case "amps":
				render_data = i;
				break;
			case "watts":
				render_data = v * i;
				break;
		} 
		var time = new Date().getTime();
		plot.series.append(time, render_data);
		//console.log(time);
		
	}

	function update_axis_labels(ndx) {
		var plot = plots[ndx];
		var idstr = 'plot'+ndx;
        switch(plots[ndx].render_type) {
			case "volts":
				$('#'+idstr+'_yaxislabel').html("Voltage (V)");
				break;
			case "amps":
				$('#'+idstr+'_yaxislabel').html("Current (µA)");
				break;
			case "watts":
				$('#'+idstr+'_yaxislabel').html("Watts (µW)");
				break;
		} 
		
	}

	function update_device_plots(ndx, data, poly_data) {
		if(!plots[ndx]) {
			var idstr = 'plot'+ndx;
			$('#plot_container').append('<div id="'+idstr+'_container" class="item-container">'+
			'<input id="'+idstr+'_title" type="text" class="plottitle" placeholder="Plot '+ndx+'"/>'+
			'<div class="checks">'+
			'<span class="spacer">Display:&nbsp;&nbsp;&nbsp;&nbsp;<input _plot_index="'+ndx+'" type="radio" name="'+idstr+'_radio" value="volts">&nbsp;Voltage</span>  '+
			'|<span class="spacer"><input _plot_index="'+ndx+'" type="radio" name="'+idstr+'_radio" checked="checked" value="amps">&nbsp;Current</span>  '+
			'|<span class="spacer"><input _plot_index="'+ndx+'" type="radio" name="'+idstr+'_radio" value="watts">&nbsp;Power</span><br>'+
			'<span class="spacer">Resolution:&nbsp;&nbsp;&nbsp;&nbsp;<input _plot_index="'+ndx+'" type="radio" name="'+idstr+'_radio2" value="ten">&nbsp;10s</span>  '+
			'|<span class="spacer"><input _plot_index="'+ndx+'" type="radio" name="'+idstr+'_radio2" checked="checked" value="five">&nbsp;5s</span>  '+
			'|<span class="spacer"><input _plot_index="'+ndx+'" type="radio" name="'+idstr+'_radio2" value="one">&nbsp;1s</span>  '+
			'</div>'+
			'</div>');
			plots[ndx] = {render_type : 'amps'};
			//plots[ndx].flot = add_iv_plot(ndx, data);
			plots[ndx].smoothie = add_stream_plot(ndx, data);
			
			// Update UI
        	if(!can_record) {
        		$('#start_stop_recording').prop('disabled', false);
        		$('#start_stop_recording').removeClass('btn-disabled');
        		$('#start_stop_recording').addClass('btn-default');
        		can_record = true;
        	}

        	if(!can_pause) {
        		$('#pause_play_stream').prop('disabled', false);
        		$('#pause_play_stream').removeClass('btn-disabled');
        		$('#pause_play_stream').addClass('btn-default');
        		can_pause = true;
        	}

        	// Add event listener for these radio buttons
        	$('input[type=radio][name='+idstr+'_radio]').change(function(e) {
        		var plot = plots[parseInt($(this).attr("_plot_index"),10)];
        		plot.render_type = this.value;
        		update_axis_labels(ndx);
        	});
			$('input[type=radio][name='+idstr+'_radio2]').change(function(e) {
        		var plot = plots[parseInt($(this).attr("_plot_index"),10)];
				switch(this.value) {
					case "ten":
						plot.smoothie.plot.options.millisPerPixel = 10000 / SMOOTHIE_WIDTH;	
						plot.smoothie.plot.options.grid.millisPerLine=1000;
						break;
					case "five":
						plot.smoothie.plot.options.millisPerPixel = 5000 / SMOOTHIE_WIDTH;	
						plot.smoothie.plot.options.grid.millisPerLine=1000;
						break;
					case "one":
						plot.smoothie.plot.options.millisPerPixel = 1000 / SMOOTHIE_WIDTH;		
						plot.smoothie.plot.options.grid.millisPerLine=500;
						break;
				} 
        		plot.smoothie.plot.updateValueRange();
        	});
		} else {
			//update_iv(ndx, data, poly_data);
			// Add to smoothie chart
			update_stream(ndx, data);
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

	ipc.on('raw_iv', function(event, data) {
		var deviceid = parseInt(data.deviceid, 10);
		var vs = data.voltage;
		var is = _.map(data.current, function (num) {return num*CURRENT_MULTIPLIER;});
		var plotdata = _.zip(vs, is);
		
		var poly_current = [];
		var poly_x = [];
		if(data.regression) {
			for (var x = _.min(vs); x < _.max(vs); x+=0.05) {
				poly_x.push(x);
				poly_current.push(poly(x, data.regression)*CURRENT_MULTIPLIER);
			};
		}
		//update_plot(deviceid, plotdata, _.zip(poly_x, poly_current));
		update_device_plots(deviceid, plotdata);
	});

	/* Pause / Play button */
	$('#pause_play_stream').click(function() {
		if(is_paused) {
			$('#pause_play_stream').html('<span class="icon icon-pause"></span>');
			is_paused = false;
			for (var i = 0; i < plots.length; i++) {
				if(!plots[i]) continue;
				var plot = plots[i].smoothie.plot;
				plot.start();
			};
		} else {
			$('#pause_play_stream').html('<span class="icon icon-play"></span>');
			is_paused = true;
			for (var i = 0; i < plots.length; i++) {
				if(!plots[i]) continue;
				var plot = plots[i].smoothie.plot;
				plot.stop();
			};			
		}
	});

	/* Record / Stop button */
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