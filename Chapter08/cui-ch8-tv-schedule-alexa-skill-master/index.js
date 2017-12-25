'use strict'

/*
* Alexa skill - TV schedules
* Author: Srini Janarthanam
*/

const request = require('request')
const express = require('express')
const bodyParser = require('body-parser')
const moment = require('moment');

const Hashmap = require('hashmap');

var usercontexts = new Hashmap(); 

const app = express()

var todaysSchedule = {};
const now = new Date();
var date = now.getDate();
if (date < 10) { date = '0' + date; }
var month = now.getMonth() + 1;
if (month < 10) { month = '0' + month; }
const todaysDate = now.getFullYear() + '-' + month  + '-' + date;

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

app.use(express.static('public'))

loadTodaysSchedule(todaysDate);

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am the TV Guide.')
})

// Index route
app.post('/alexa', function (req, res) {
    console.log('Request from Alexa:');
    console.log(req.body);
    
    var sessionContext = {
                            'show': null
                         };
    
    var sessionId = req.body.session.sessionId;
    if (!usercontexts.get(sessionId)){
        usercontexts.set(sessionId, sessionContext);
    } else {
        sessionContext = usercontexts.get(sessionId);
    }
    
    var userIntent = '';
    if (req.body.request.type === 'SessionEndedRequest'){
        userIntent = 'AMAZON.StopIntent';
    } else {
        userIntent = req.body.request.intent.name;
    }
    
    console.log('UserIntent:' + userIntent);
    
    var rjson = {
        "version": "1.0",
       
        "response": {
             "shouldEndSession": false,
            "outputSpeech": {
              "type": "SSML",
                "ssml": "<speak>Hello, I am your TV Guide!</speak>"
            }
        }
    };
    
    if (userIntent === 'AMAZON.StopIntent'){
        rjson.response.shouldEndSession = true;
        rjson.response.outputSpeech.ssml = '<speak> Ok. Have a good day! </speak>';
        console.log(rjson);
        res.json(rjson);
    }
    else {
        
        if (userIntent === 'GetNextProgramme'){
            
            var network = req.body.request.intent.slots.network.value;
            
            if (network === 'BBC 1'){ network = 'BBC One'; }
            if (network === 'BBC1'){ network = 'BBC One'; }
            if (network === 'BBC 2'){ network = 'BBC Two'; }
            if (network === 'BBC2'){ network = 'BBC Two'; }
            
            var e = getNextProgrammeInNetwork(network);
            sessionContext.show = e; 
            usercontexts.set(sessionId, sessionContext);
            
            rjson.response.shouldEndSession = false;
            rjson.response.outputSpeech.ssml = '<speak> The next show on ' + network + ' is ' + 
                e.show.name + ' at ' + e.airtime + 
                '! </speak>';
            console.log(rjson);
            res.json(rjson);
        }
        else if (userIntent === 'GetProgrammeAtTime'){
            
            var network = req.body.request.intent.slots.network.value;
            
            if (network === 'BBC 1'){ network = 'BBC One'; }
            if (network === 'BBC1'){ network = 'BBC One'; }
            if (network === 'BBC 2'){ network = 'BBC Two'; }
            if (network === 'BBC2'){ network = 'BBC Two'; }
            
            var time = req.body.request.intent.slots.time.value;
            
            var e = getProgrammeAtTime(network, time);
            sessionContext.show = e;
            usercontexts.set(sessionId, sessionContext);
            
            rjson.response.shouldEndSession = false;
            rjson.response.outputSpeech.ssml = '<speak> On ' + network + 
                ' at ' + e.airtime + 
                ' is ' + e.show.name + 
                '! </speak>';
            console.log(rjson);
            res.json(rjson);
        }
        else if (userIntent === 'GetDescription'){
            var e = sessionContext.show;
            var desc = getDescription(e);
            
            rjson.response.shouldEndSession = true;
            rjson.response.outputSpeech.ssml = '<speak> ' + desc +
                ' </speak>';
            console.log(rjson);
            res.json(rjson);
        }
        else if (userIntent === 'Thank'){  
            rjson.response.shouldEndSession = true;

            rjson.response.outputSpeech.ssml = '<speak> You are most welcome. Goodbye! </speak>';
            console.log(rjson);
            res.json(rjson);
        }
       
        else {
            rjson.response.shouldEndSession = true;
            console.log(rjson);
            res.json(rjson);
        }
    }
    
    
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

function loadTodaysSchedule(todaysDate){
    var url = 'http://api.tvmaze.com/schedule?country=GB&date=' + todaysDate;
    console.log('URL:' + url);
    request({
        url: url,
        method: 'GET'
    },
    function (error, response, body) {
        //response is from the bot
        if (!error && response.statusCode == 200) {
            // Print out the response body
            todaysSchedule = JSON.parse(body);
            console.log('Todays Schedule: ' + todaysSchedule.length);
            console.log(todaysSchedule);
            
        } else {
            console.log('Error: ' + error)
            console.log('Statuscode: ' + response.statusCode)
        }
    });
}

function getNextProgrammeInNetwork(networkName){
    console.log('Getting next programme in : ' + networkName);
    for (var i=0; i < todaysSchedule.length; i++){
        var e = todaysSchedule[i];
        var showtime = moment(e.airdate + ' ' + e.airtime);
        
        moment().format();

        var a = moment();
        var b = moment(showtime);
        if (a.diff(b, 'minutes') < 0){
            if (e.show.network.name === networkName){
                console.log(e.show.name + ' on ' + e.show.network.name + ' at ' + e.airtime);
                return e;
            }
        }
    }
    
}

function getProgrammeAtTime(networkName, time){
    console.log('Getting next programme in : ' + networkName + ' at ' + time);
    for (var i=0; i < todaysSchedule.length; i++){
        var e = todaysSchedule[i];
        if (e.show.network.name === networkName){
            var showtime = moment(e.airdate + ' ' + e.airtime);
            var requestedtime = moment(e.airdate + ' ' + time);
            moment().format();

            var a = moment(requestedtime);
            var b = moment(showtime);
            if (a.diff(b, 'minutes') > -30 &&  a.diff(b, 'minutes') < 30 ){

                    console.log(e.show.name + ' on ' + e.show.network.name + ' at ' + e.airtime);
                    return e;
            }
        }


    }
    
}

function getDescription(episode){
    console.log('Getting episode info:' + episode.show.name);
    console.log(episode.show.summary);
    return episode.show.summary;
    
}