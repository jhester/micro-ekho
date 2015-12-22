'use strict';
const PRODUCTION = true;
const electron = require('electron');
var ipc = electron.ipcMain;
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
var messenger = require('messenger');
var fs = require('fs');
var regression = require('regression');
var _ = require('underscore');
var child_process = require('child_process');


var plotfilestreams = [];
var is_recording = false;
const ROWS_PER_PACKET = 15;

/*
var child_data_server = child_process.exec(['node data_stream.js'], function(error, stdout, stderr) {
  if (error instanceof Error)
    throw error
  process.stderr.write(stderr);
  process.stdout.write(stdout);
  process.exit(code);
});

process.on('exit', function () {
    child_data_server.kill();
});*/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
  //child_data_server.kill();
});

ipc.on('start-recording', function(event, data) {
  console.log('Start recording...');
  console.log(data);
  is_recording = true;
  var row_header = 'UNIXTime,DeviceID,';
  for (var i = 0; i < ROWS_PER_PACKET; i++) {
    row_header+="V"+i+",";
  };
  for (var i = 0; i < ROWS_PER_PACKET; i++) {
    row_header+="I"+i+",";
  };
  row_header = row_header.substring(0, row_header.length-1);

  // Make file pointers for each plot / device
  for (var i = 0; i < data.plots.length; i++) {
    var wstream = fs.createWriteStream(data.dirname + "/"+data.plots[i].title+".csv");
    wstream.write(row_header+"\n");
    plotfilestreams[data.plots[i].ndx] = wstream;
  };

});

ipc.on('stop-recording', function(event, data) {
  console.log('Stop recording...');
  for (var i = 0; i < plotfilestreams.length; i++) {
    if(plotfilestreams[i]) plotfilestreams[i].end();
  }
  is_recording = false;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800, height: 700,
    "max-width": 800, "max-height": 700,
    "min-width": 800, "min-height": 700
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');

  // Open the DevTools.
  if(!PRODUCTION) mainWindow.webContents.openDevTools();
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  
});


var server = messenger.createListener(8000);
server.on('raw_iv', function(message, data){
  // Regression
  //var result = regression('polynomial', _.zip(data.voltage, data.current), 3);
  //data.regression = result.equation;
  try {mainWindow.webContents.send('raw_iv', data);} catch(e) {/*child_data_server.kill();*/}
  // Write data if we are recording
  if(is_recording) {
    var write_string = (new Date()).getTime()+","+data.deviceid+","+data.voltage.join(",")+data.current.join(",")+"\n";
    plotfilestreams[data.deviceid].write(write_string);
  }
});