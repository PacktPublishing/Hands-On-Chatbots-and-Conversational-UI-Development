#!/usr/bin/env node

console.log('Running - SMS Train Notification');

//Index.js - SMSBot

//Add your Account SID 
var accountSid = 'your_account_sid'; 

//Add your Auth Token here
var authToken = 'your_auth_token';   

var destination = 'Glasgow Queen Street';
var userPhoneNumber = '+447888999999';
var sourceStationCode = 'EDB';
var sourceStation = 'Edinburgh Waverley';

getTrains('EDB');




function getTrains(source){
    var request = require('request');
    var url = 'http://transportapi.com/v3/uk/train/station/' + source+ '/live.json?app_id=60ce46ea&app_key=YOUR_API_KEY';
    //console.log(url);
    
    request(url, function (error, response, body) {
       if (response){
            var json = JSON.parse(body);
            if (json.departures){
                //console.log('Departures:', JSON.stringify(json.departures)); 
                
                var dep = getTrainsToDestination(destination, json.departures.all);
                
                var summary = summarize(destination, dep);
    
                console.log('Summary: ' + summary);
                sendSMS(summary, userPhoneNumber);
                
            } else  {
                console.log('No Departures found!');
            } 
        } else {
            console.log('error:', error); // Print the error if one occurred 
        }
    });
}


function summarize(destination, departures){
    
    var out = '';
    if (departures.length > 0){
        out = 'Here are the departures this morning to ' + destination + ".\n";
        for (var i=0; i< departures.length; i++){
            var service = departures[i];
            var serviceSummary = service.operator_name + " at " + service.expected_departure_time; 
            out += serviceSummary + "\n"
        }
        
    } else {
        out = 'There are no trains to ' + destination + ' from ' + sourceStation;
    }
    
    
    return out;
}


function getTrainsToDestination(destination, allDepartures){
    var d = [];
    
    if (allDepartures){
        for (var i=0; i < allDepartures.length; i++){
            var service = allDepartures[i];
            if (service.destination_name == destination){
                d.push(service)
            }
        }
        
    }
    return d;
}


function sendSMS(msg, userPhoneNumber){
    var twilio = require('twilio');
    var client = new twilio(accountSid, authToken);

    //Create a message with to and from numbers
    client.messages.create({
        body: msg,
        to: userPhoneNumber,  
        from: '+441438301012' 
    })
    .then((message) => console.log(message.sid));

}
