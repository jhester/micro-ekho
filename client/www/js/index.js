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
var MAX_NODES = 6;
var num_graphs = 0;// Already have the totals graph
var graphs = [];

var redbear = {
    serviceUUID:        "713D0000-503E-4C75-BA94-3148F18D941E",
    txCharacteristic:   "713D0003-503E-4C75-BA94-3148F18D941E", // transmit is from the phone's perspective
    rxCharacteristic:   "713D0002-503E-4C75-BA94-3148F18D941E"  // receive is from the phone's perspective
};

var graph_settings_open = false;
var current_graph_settings_id = null;

// Holds three lookupt tables. Lookup key is id of graph 
var stats = {
    estimated_current : {}, // in milli-amperes
    max_power : {}, // milli-watts
    total_energy : {}, // milli-joules
    last_timestamp : {},
    reset : function(id) {
       this.max_power[id] = 0;
       this.total_energy[id] = 0;
        $('#max_power_'+id).text("0mW");
        $('#total_energy_'+id).text("0mJ");
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
  var max = range.max + 0.25;
  return {min: min, max: max};
}

var time_last_checked = new Date().getTime();

function create_plot_container(id, title) {
    col = String.fromCharCode('a'.charCodeAt() + num_graphs % 3); 
    var htmladd = $('<div data-role="collapsible" data-mini="true" id="container_'+id+'" data-iconpos="right">' +
        '<h4><span id="title_'+id+'">'+title+'</span>, <span id="max_power_'+id+'">0mW</span>, <span id="total_energy_'+id+'">0mJ</span></h4>'+
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
        grid:{verticalSections:5},
        yRangeFunction:myYRangeFunction
    });
    smoothie.streamTo(document.getElementById(id), 100);
    var line1 = new TimeSeries();
    smoothie.addTimeSeries(line1, {lineWidth:2,strokeStyle:'#00ff00'});
     
    stats.estimated_current[id] = 0.001;
    stats.max_power[id] = 0;
    stats.total_energy[id] = 0;
    
    num_graphs++;
    return {id : id, graph : smoothie, series : line1, title : title};
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
    var timestamp = new Date().getTime() + 1000;
    var max_voltage = _.max(ekho_data.data);
    thegraph.series.append(timestamp, (max_voltage / 1024.0 * 1.5) * 2);
    //for (var i = ekho_data.data.length - 1; i >= 0; i--) {
    //    thegraph.series.append(ekho_data.data[i], new Date().getTime() - (i * 100));
    //};

    // Update stats
    if(stats.estimated_current[graph_id_actual] * max_voltage > stats.max_power[graph_id_actual]) {
        stats.max_power[graph_id_actual] = stats.estimated_current[graph_id_actual] * max_voltage;
    }
    // Energy = power (I * V) * time    
    stats.total_energy[graph_id_actual] += stats.estimated_current[graph_id_actual] * max_voltage * 0.1;
    // stats.last_timestamp[graph_id_actual]
    
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


function handle_mock_server_data(data) {
    var ekho_data = JSON.parse(data).data;
    // Get most recent data for all graphs
    var all_node_ids = _.uniq(_.pluck(ekho_data, 'id'));

    _.each(all_node_ids, function(id) {
        var datafornode = _.where(ekho_data, {id : id});
        // If graphs not created then create them
        var thegraph = _.findWhere(graphs, {id : 'graph'+id})
        if(!thegraph) {
            thegraph = create_plot_container('graph'+id, 'Voltage');
            graphs.push(thegraph);    
        }
        // Add data to the graph now
        var max_voltage = 0;
        for (var i = datafornode.length - 1; i >= 0; i--) {
            if(_.max(datafornode[i].data) > max_voltage) max_voltage = _.max(datafornode[i].data);
        };
        thegraph.series.append(new Date().getTime(), (max_voltage / 1024.0 * 1.5) * 2);

    });
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
                $('#max_power_'+item.id).text(stats.max_power[item.id].toFixed(2)+"mW");
                $('#total_energy_'+item.id).text(stats.total_energy[item.id].toFixed(2)+"mJ");
            });
            
        }, 1000);
        app.scan();
    },

    scan : function() {
        if(DEBUG) return;
        // Reset device
        var deviceList = $('#scanneddevices');
        deviceList.empty();
        deviceList.append('<li><b>Choose a device to connect to.</b><br/>Using Bluetooth Low Energy.</li>');
        deviceList.listview("refresh");
        if(cordova.platformId === 'android') {
            ble.enable(
                function() {
                    console.log("Bluetooth is enabled");
                    ble.scan([], 5, app.onDeviceList, app.failure);

                },
                function() {
                    console.log("The user did *not* enable Bluetooth");
                }
            );
        } else {
            // iOS
            ble.scan([redbear.serviceUUID], 5, app.onDeviceList, app.failure);
        }
    },

    failure : function(errorcode) {
        $.mobile.loading("hide");
        console.log("ERROR: "+JSON.stringify(errorcode));
        alert("ERROR: "+JSON.stringify(errorcode));
    },

    onDeviceList : function(devicefound) {
        console.log(devicefound);
        var deviceList = $('#scanneddevices');
        deviceList.append('<li deviceid="'+devicefound.id+'"><a href="'+devicefound.id+'"><b>' + devicefound.name + '</b><br/>' + devicefound.id + '</a></li>');
        deviceList.listview("refresh");
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
        if(data.length == 20 && data[0] > 0 && data[0] < MAX_NODES+1) {
            for (var i = 1; i < 4; i++) {
                if(data[i] != data[0]) return;
            };
            var converted_data = { data : []};

            converted_data.id = data[0];
            for(var i=4;i<data.length;i+=2){
                converted_data.data.push((data[i+1] << 8) | data[i]);
            }
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
            
            var ekho_data = {
                id : id_for_device +1,
                data : [Math.floor(Math.random() * 1024),2,3,4,5,6]
            };
            handle_server_data(ekho_data);
            id_for_device = (id_for_device+1) % (MAX_NODES - 1);
        }, 100);
    });
}

app.initialize();