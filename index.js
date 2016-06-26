"use strict";
// trigger the debugger so that you can easily set breakpoints
//debugger;

var VectorWatch = require('vectorwatch-browser');
var Schedule = require('node-schedule');
var StorageProvider = require('vectorwatch-storageprovider');

var vectorWatch = new VectorWatch();
var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

var logger = vectorWatch.logger;

var hours = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
var minutes = ['', 'five', 'ten', 'quarter', 'twenty', 'twenty five', 'half'];

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');
    logger.info(event);

    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    logger.info('on subscribe');
    logger.info(event);

    var time = getCurrentTime();    

    response.setValue(time);
    response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});

function getCurrentTime() {
    var date = new Date();
    var hour = date.getHours()%12;
    var minute = Math.round(date.getMinutes()/5);
    if (minute == 12) {
        minute = 0;
        hour = (hour+1)%12;
    }
    var time;
    
    if (minute === 0) {
        time = hours[hour] + " o'clock";
    } else if (minute <= 6) {
        time = minutes[minute] + ' past ' + hours[hour];
    } else{
        time = minutes[12-minute] + ' to ' + hours[(hour+1)%12];
    }
    console.log(time);
    return time;
}

function pushUpdates() {
    var streamText = getCurrentTime();
    storageProvider.getAllUserSettingsAsync().then(function(records) {
        for (var i=0; i<records.length; i++) {
            vectorWatch.pushStreamValue(records[i].channelLabel, streamText);
        }
    });
}

function scheduleJob() {
    var scheduleRule = new Schedule.RecurrenceRule();
    var times = [];
    for (var i=0;i<60;i+=5) {
        times.push(i);
    }
    scheduleRule.minute = times; // will execute at :15 and :45 every hour
    Schedule.scheduleJob(scheduleRule, pushUpdates);
}

vectorWatch.createServer(scheduleJob);
