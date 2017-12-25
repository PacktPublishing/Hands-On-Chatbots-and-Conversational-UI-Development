'use strict'

/*
* Google Home 
*/

const request = require('request')
const syncrequest = require('sync-request')
const express = require('express')
const bodyParser = require('body-parser')
const moment = require('moment');

const uuid = require('node-uuid')
const todoist_token = 'YOUR_TODOIST_TOKEN';



const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

app.use(express.static('public'))

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am your man Friday.')
})

// Handle the intents
app.post('/home', function (req, res) {
    
    console.log('Request from DialogFlow:');
    console.log(req.body);
    
    var intent = req.body.result.metadata.intentName;
    var botSpeech = 'hello world';
    
    if (intent === 'inform_task_description'){
        var taskDescription = req.body.result.parameters.task;
        addTask(taskDescription);
        botSpeech = 'Adding new task.';
    }
    else if (intent === 'list_all_tasks'){
        
        botSpeech = getAllTasks();
        
    }
    
    var out = {speech: botSpeech,
            displayText: botSpeech,
            data: null};
    
    var outString = JSON.stringify(out);
    console.log('Out:' + outString);
    
    res.send(outString);
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


function addTask(taskDescription){
    var task = {'type': 'item_add', 
           'temp_id': uuid.v4(),
           'uuid': uuid.v4(),
           'args': {
               'content': taskDescription
           }};

    var url = 'https://todoist.com/api/v7/sync?token=' + todoist_token + 
                '&sync_token=*&resource_types=["items"]&commands=[' + JSON.stringify(task) +']';
    console.log('URL:' + url);
    request({
        url: url,
        method: 'GET'
    },
    function (error, response, body) {
        //response is from the bot
        if (!error && response.statusCode == 200) {
            console.log(JSON.parse(body));
        } else {
            console.log('Error: ' + error)
            console.log('Statuscode: ' + response.statusCode)
        }
    });
}

function getAllTasks(){
    var url = 'https://todoist.com/api/v7/sync?token=' + todoist_token + 
                    '&sync_token=*' + 
                    '&resource_types=["items"]';
    console.log('URL:' + url);

    var resp = syncrequest('GET', url);
    var allItems = JSON.parse(resp.getBody('utf8')).items;  
    var allItemsSummary = '';
    for (var i = 0; i < allItems.length; i++){
        allItemsSummary += allItems[i].content;
        if (i < allItems.length - 2){
            allItemsSummary += ', ';
        } 
        else if (i == allItems.length - 2) {
            allItemsSummary += ' and ';
        } 
        else {
            allItemsSummary += '.';
        }
    }
    var allTasks = 'You have ' + allItems.length + ' in your list. ' + allItemsSummary;
    return allTasks;
}   