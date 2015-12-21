/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var DEBUG = true;
var ADC_RESOLUTION = 1024;
var ADC_REF_VOLTAGE = 3.0;
var MAX_NODES = 4;
var num_graphs = 0;// Already have the totals graph
var graphs = [];
var scanning = false;
var redbear = {
    serviceUUID:        "713D0000-503E-4C75-BA94-3148F18D941E",
    txCharacteristic:   "713D0003-503E-4C75-BA94-3148F18D941E", // transmit is from the phone's perspective
    rxCharacteristic:   "713D0002-503E-4C75-BA94-3148F18D941E"  // receive is from the phone's perspective
};

var graph_settings_open = false;
var current_graph_settings_id = null;

// Holds three lookupt tables. Lookup key is id of graph 
var stats = {
    estimated_current : {}, // in milli-amperes,
    average  : {},
    max_power : {}, // milli-watts
    total_energy : {}, // milli-joules
    last_timestamp : {},
    reset : function(id) {
       this.max_power[id] = 0;
       this.total_energy[id] = 0;
       this.average[id] = 0;
        $('#max_power_'+id).text("0mW");
        $('#total_energy_'+id).text("0mJ");
        $('#average_'+id).text("0V");
    }
};

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// ASCII only
function stringToBytes(string) {
   var array = new Uint8Array(string.length);
   for (var i = 0, l = string.length; i < l; i++) {
       array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function myYRangeFunction(range) {
  // TODO implement your calculation using range.min and range.max
  var min = 0;
  var max = range.max;
  return {min: min, max: max};
}

var time_last_checked = new Date().getTime();

function create_plot_container(id, title) {
    col = String.fromCharCode('a'.charCodeAt() + num_graphs % 3); 
    var htmladd = $('<div data-role="collapsible" data-mini="true" id="container_'+id+'" data-iconpos="right">' +
        '<h4><span id="title_'+id+'">'+title+'</span>, <span id="max_power_'+id+'">0mW</span>, <span id="total_energy_'+id+'">0mJ</span>, <span id="average_'+id+'">0V</span></h4>'+
        '<canvas id="'+id+'" width="'+($(window).width()-80)+'" height="120"></canvas>'+
        '<a id="btn_'+id+'" __graph_id="'+id+'" href="#popupLogin" data-rel="popup" data-position-to="window"  data-transition="pop" class="ui-btn ui-corner-all ui-icon-gear ui-btn-icon-left ui-mini" data-transition="pop">Figure Settings</a>' +
        '</div>');
    /*var htmladd = '<div class="ui-block-'+col+' ui-corner-all custom-corners" id="container_'+id+'">'+
                    '<div class="ui-bar ui-bar-a">'+title+
                '</div>'+
                '<div class="ui-body ui-body-a">'+
                    '<canvas id="'+id+'" width="'+$(window).width()+'" height="120"></canvas>'+
                '</div></div>';*/
    //$('#graph_grids').append(htmladd);
    $('#main_page_content').append(htmladd);
    htmladd.collapsible();
    //$('#btn_graph_'+id).button();
    var smoothie = new SmoothieChart({
        interpolation:'linear',
        minValue : 0.0,
        millisPerPixel:2,
        grid:{verticalSections:5},
        yRangeFunction:myYRangeFunction
    });
    smoothie.streamTo(document.getElementById(id), 150);
    var line1 = new TimeSeries();
    smoothie.addTimeSeries(line1, {lineWidth:2,strokeStyle:'#00ff00'});
     
    stats.estimated_current[id] = 0.001;
    stats.max_power[id] = 0;
    stats.total_energy[id] = 0;
    stats.average[id] = 0;
    
    num_graphs++;
    return {id : id, graph : smoothie, series : line1, title : title, last_data : []};
}

function handle_server_data(ekho_data) {
    // If graphs not created then create them
    var graph_id_actual = 'graph'+ekho_data.id;
    var thegraph = _.findWhere(graphs, {id : 'graph'+ekho_data.id})
    if(!thegraph) {
        console.log('Created graph'+ekho_data.id);
        thegraph = create_plot_container('graph'+ekho_data.id, "#"+ekho_data.id+' Voltage');
        graphs.push(thegraph);    

    }
    // Add data to the graph now
    var timestamp = new Date().getTime();
    var max_voltage = _.max(ekho_data.data);
    //thegraph.series.append(timestamp, ekho_data.data[ekho_data.data.length-1]);
    
    // Get place in new data (compare to old data)
    // If the oldest data point in the new data is the same as the newest point in old data
    // Then skip this step, 
    var next = ekho_data.data;
    var start = thegraph.last_data;
    var old_data_length = start.length;
    var index_to_read_data = 0;
    if(next[0] != start[old_data_length-1]) {
        for (var i = next.length - 1; i >= 0; i--) {
            if(Math.abs(start[old_data_length-1] - next[i]) < 0.0001) {
                index_to_read_data=i+1; 
                break;
            }
        };
    }
    var printstring = "";
    for (var i = index_to_read_data, j=0; i < next.length ; i++, j++) {
        if(next[i] > 3.3) {
            console.log("Crap");
            continue;
        }
        thegraph.series.append(timestamp + j * 50, next[i]);
        printstring +=next[i]+","
    };
    console.log(printstring);
    thegraph.last_data = next;

    // Update stats
    if(stats.estimated_current[graph_id_actual] * max_voltage > stats.max_power[graph_id_actual]) {
        stats.max_power[graph_id_actual] = stats.estimated_current[graph_id_actual] * max_voltage;
    }
    // Energy = power (I * V) * time    
    stats.total_energy[graph_id_actual] += stats.estimated_current[graph_id_actual] * max_voltage * 0.1;
    // stats.last_timestamp[graph_id_actual]
    stats.average[graph_id_actual] = max_voltage;
    $('#average_'+graph_id_actual).text(max_voltage.toFixed(3)+"V");
    if(timestamp - time_last_checked > 1000) {
        var sum_power = 0;
        for (var i = graphs.length - 1; i >= 0; i--) {

        }

        // Set interval for updating stats


        //graph_totals_s.append(timestamp, (max_voltage / 1024.0 * 1.5) * 2);
        /*var remove_ndxs = [];
        for (var i = graphs.length - 1; i >= 0; i--) {
            if(graphs[i].series.data.length == 0 || timestamp - _.last(graphs[i].series.data)[0] > 1000) {
                remove_ndxs.push(i);
            }
        }; 

        // Remove tagged graphs
        for (var i = remove_ndxs.length - 1; i >= 0; i--) {
            console.log(remove_ndxs);
            console.log(graphs);
            console.log("Removed: "+$("#container_"+graphs[remove_ndxs[i]].id).remove());
            graphs.splice(remove_ndxs[i], 1);
            console.log("Removed graph");
        };*/
        time_last_checked = timestamp;
    }
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    onDeviceReady: function() {
        var deviceList = $('#scanneddevices');
        $( document ).on( "tap", "#scanneddevices li", function( event ) {
            var listitem = $( this );
            var device_id = listitem.attr('deviceid');
            console.log(device_id);
            app.connect(device_id);
        });

        // Refresh button
        $( document ).on( "vclick", "#refreshpage", function( event ) {
           app.scan();
        });

        // Figure settings buttons
        $( document ).on( "vclick", 'a[data-rel="popup"]', function (e) {
            graph_settings_open = true;
            var link = $(this);
            current_graph_settings_id = link.attr('__graph_id');
            console.log(current_graph_settings_id);
            $('#settings_title').val("");
            $('#settings_current').val("")
        });

        // Reset stats button
        $( document ).on( "vclick", "#reset_stats", function( event ) {
            stats.reset(current_graph_settings_id);
            graph_settings_open = false;
            $('#popupLogin').popup( "close" );
        });

        // Confirm settings button
        $( document ).on( "vclick", "#confirm_settings", function( event ) {
            // If title not empty then change it
            var close = true;
            var new_title = $('#settings_title').val();
            if(new_title) {
                $('#title_'+current_graph_settings_id).text(new_title);
            }

            // Detect is current is a number
            var new_estimated_current = $('#settings_current').val();
            if(isNumeric(new_estimated_current)) {
                stats.estimated_current[current_graph_settings_id] = new_estimated_current;
            } else if(new_estimated_current != "") {
                alert("Not a valid number")
                $('#settings_current').val("")
                close = false;
            }

            // Close if no validation issues
            if(close) {
                graph_settings_open = false;
                $('#popupLogin').popup( "close" );
            }
        });

         // Cancel settings button
        $( document ).on( "vclick", "#cancel_settings", function( event ) {
            graph_settings_open = false;
            $('#popupLogin').popup( "close" );
        });

        // Update stats
        setInterval(function(e) {
            _.each(graphs, function(item) {
                $('#max_power_'+item.id).text(Math.round(stats.max_power[item.id]*1000)+"µW");
                $('#total_energy_'+item.id).text(stats.total_energy[item.id].toFixed(2)+"mJ");
            });
            
        }, 1000);
        app.scan();
    },

    scan : function() {
        if(DEBUG == true) return;
        // Reset device
        var deviceList = $('#scanneddevices');
        deviceList.empty();
        deviceList.append('<li><b>Choose a device to connect to.</b><br/>Using Bluetooth Low Energy.</li>');
        deviceList.listview("refresh");
        if(scanning == false) {
            if(cordova.platformId === 'android') {
                ble.enable(
                    function() {
                        console.log("Bluetooth is enabled");
                        ble.scan([], 5, app.onDeviceList, app.failure);
                        scanning = true;
                    },
                    function() {
                        console.log("The user did *not* enable Bluetooth");

                    }
                );
            } else {
                // iOS
                $.mobile.loading("show");
                ble.startScan([], app.onDeviceList, app.failure);

                setTimeout(ble.stopScan,
                    5000,
                    function() { $.mobile.loading("hide");console.log("Scan complete");scanning = false; },
                    function() { $.mobile.loading("hide");console.log("stopScan failed");scanning = false; }
                );
                scanning = true;
            }
        }
    },

    failure : function(errorcode) {
        scanning = false;
        $.mobile.loading("hide");
        console.log("ERROR: "+JSON.stringify(errorcode));
        alert("ERROR: "+JSON.stringify(errorcode));
    },

    onDeviceList : function(devicefound) {
        scanning = false;
        console.log("Found: "+devicefound);
        if(cordova.platformId === 'android') {
            var deviceList = $('#scanneddevices');
            deviceList.append('<li deviceid="'+devicefound.id+'"><a href="'+devicefound.id+'"><b>' + devicefound.name + '</b><br/>' + devicefound.id + '</a></li>');
            deviceList.listview("refresh");
        } else {
            var deviceList = $('#scanneddevices');
            deviceList.append('<li deviceid="'+devicefound.uuid+'"><a href="'+devicefound.uuid+'"><b>' + devicefound.name + '</b><br/>' + devicefound.uuid + '</a></li>');
            deviceList.listview("refresh");
        }
        
    },

    connect: function(device_id) {
            var thedevice_id = device_id;
            var onConnect = function(e) {
                $.mobile.loading("hide");
                ble.startNotification(thedevice_id, redbear.serviceUUID, redbear.rxCharacteristic, app.onData, app.failure);
                $.mobile.pageContainer.pagecontainer("change", "#mainpage");

            };
            $.mobile.loading("show");
            ble.connect(device_id, onConnect, app.failure);
    },

    onData : function(incoming_data) {
        var data = new Uint8Array(incoming_data);
        if(data.length == 20 && data[0] < MAX_NODES) {
            var converted_data = { data : []};

            converted_data.id = data[0];
            for(var i=2;i<data.length;i+=2){
                var digital_voltage = (data[i+1] << 8) | data[i];
                if(digital_voltage > ADC_RESOLUTION) {
                    console.log("BAD DATA");
                    return; // Out of bounds / bad data error
                }
                converted_data.data.push(digital_voltage / ADC_RESOLUTION * ADC_REF_VOLTAGE);
            }
            
            var begin_of_array = converted_data.data.splice(data[1]+1, data.length);
            converted_data.data = begin_of_array.concat(converted_data.data);
            handle_server_data(converted_data);
        }
    }
};

if(DEBUG) {
    $(document).ready(function() {
        app.onDeviceReady();
        // Add link to main page with debug data
        var button = $('<a href="#mainpage" class="ui-btn">Debug Data</a>');
        $('#connect_content').append(button);
        button.button();
        var id_for_device = 0;
        setInterval(function(e) {
            // Loop index
            var ekho_mock_data = [id_for_device +1, 4];

            for (var i = 0; i < 9; i++) {
                var num = Math.floor(Math.random() * 1024);
                ekho_mock_data.push(num & 0xff);
                ekho_mock_data.push( (num >> 8 ) & 0xff);
            };
            
            app.onData(new Uint8Array(ekho_mock_data));
            
            id_for_device = (id_for_device+1) % (MAX_NODES - 1);
        }, 100);
    });
}

app.initialize();