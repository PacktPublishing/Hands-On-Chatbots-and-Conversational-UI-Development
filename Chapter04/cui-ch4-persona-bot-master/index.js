

// EinsteinBot webhooks
// Author : Srini Janarthanam

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

app.use(express.static('public'))

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am EinsteinBot webhook.')
})


app.post('/emc2/', function (req, res) {
    console.log(JSON.stringify(req.body));
    var weight = req.body.result.parameters.weight;
    var m = weight.amount;
    var weight_unit = weight.unit;
    //convert weight into kg
    if (weight_unit == 'g'){
        m = m/1000.0;
    }
    var c2 = 9 * 10^16; //in m^2/s^2
    var e = m * c2;
    
    res.setHeader('Content-Type', 'application/json');
    
    var botSpeech = "Energy that the system can create is " + e 
    + " Joules.";
    
    out = {speech: botSpeech,
            displayText: botSpeech,
            data: null};
    
    var outString = JSON.stringify(out);
    console.log('Out:' + outString);
    
    res.send(outString);
})

