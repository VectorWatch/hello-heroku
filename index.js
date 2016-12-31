"use strict";

var VectorWatch = require('vectorwatch-sdk');
var request = require('request');

var vectorWatch = new VectorWatch();
var logger = vectorWatch.logger;

var totalSchedules = 0;

var hours = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
var minutes = ['', 'five', 'ten', 'quarter', 'twenty', 'twenty five', 'half'];

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');
    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    var time = getCurrentTime();  
    logger.info('on subscribe', time); 

    response.setValue(time);
    response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});

vectorWatch.on('webhook', function (event, response, records) {
    logger.info('Webhook!');
    response.send();
});

vectorWatch.on('schedule', function(records) {
    var streamText = getCurrentTime();
    logger.info('Pushing updates to ' + records.length + ' users', streamText);
    records.forEach(function(record) {
        // record.userSettings
        record.pushUpdate(streamText);
    });

    // Once every 30 mins keep the heroku server alive.
    if (totalSchedules % 6 == 0) {
        keepAlive();
    }

    totalSchedules++;
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

    return time;
}

function keepAlive() {
    logger.info('keep alive'); 

    //A request to Vector server on the webhook endpoint will trigger an outside request for the current application
    var url = 'https://endpoint.vector.watch/VectorCloud/rest/v1/stream/'+process.env.STREAM_UUID+'/webhook';
    request(url);
}
