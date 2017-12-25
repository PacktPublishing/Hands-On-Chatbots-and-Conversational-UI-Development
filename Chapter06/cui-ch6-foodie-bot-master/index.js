
//Foodie bot
//Author: Srini Janarthanam


var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

var baseURL = 'https://developers.zomato.com/api/v2.1/';
var apiKey = 'YOUR-API-KEY'; //Zomato key

var catergories = null;
var cuisines = null;

getCategories();

getCuisines(76);


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/foodiebot', connector.listen());

// This is a dinner reservation bot that uses multiple dialogs to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Hi there! Hungry? Looking for a restaurant?");
        session.send("Say 'search restaurant' to start searching.");
        session.endDialog();
    }
]);


// Custom recognizer
bot.recognizer({
  recognize: function (context, done) {
        var intent = { score: 0.0 };

        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
                case 'help':
                    intent = { score: 1.0, intent: 'get-help' };
                    break;
                case 'goodbye':
                    intent = { score: 1.0, intent: 'say-goodbye' };
                    break;
            }
        }
        done(null, intent);
    }
});


bot.dialog('help', [
    function (session) {
        session.send('I can help you look for a restaurant or order a takeaway!');
        session.endDialog();
    }
]).triggerAction({
    matches: 'get-help'
});

bot.dialog('goodbye', [
    function (session) {
        session.send('Goodbye now!');
        session.endConversation();
    }
]).triggerAction({
    matches: 'say-goodbye'
});

           

// Search for a restaurant
bot.dialog('searchRestaurant', [
    function (session) {
        session.send('Ok. Searching for a restaurant!');
        builder.Prompts.text(session, 'Where?');
    },
    function (session, results) {
        session.conversationData.searchLocation = results.response;
        builder.Prompts.text(session, 'Cuisine? Indian, Italian, or anything else?');
    },
    function (session, results) {
        session.conversationData.searchCuisine = results.response;
        builder.Prompts.text(session, 'Delivery or Dine-in?');
    },
    function (session, results) {
        session.conversationData.searchCategory = results.response;
        session.send('Ok. Looking for restaurants..');
        getRestaurant(session.conversationData.searchCuisine, 
                      session.conversationData.searchLocation, 
                      session.conversationData.searchCategory, 
                      session);
    }
])
    .triggerAction({
    matches: /^search restaurant$/i,
    confirmPrompt: 'Your restaurant search task will be abandoned. Are you sure?'
});



function getRestaurant(cuisine, location, category, session){
    
    var cuisineId = getCuisineId(cuisine);
    var categoryId = getCategoryId(category);
    
    var options = {
        uri: baseURL + 'locations',
        headers: {
            'user-key': apiKey
        },
        qs: {'query':location},
        method: 'GET'
        }
    var callback = function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            } else {
                console.log(body);
                locationInfo = JSON.parse(body).location_suggestions;
                search(locationInfo[0], cuisineId, categoryId, session);
                
            }
        }
    
    request(options,callback);
    
    
}

function search(location, cuisineId, categoryId, session){
    var options = {
        uri: baseURL + 'search',
        headers: {
            'user-key': apiKey
        },
        qs: {'entity_id': location.entity_id,
            'entity_type': location.entity_type, 
            'cuisines': [cuisineId],
            'category': categoryId},
        method: 'GET'
    }
    var callback = function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            } else {
                console.log('Found restaurants:')
                console.log(body);
                //var resultsCount = JSON.parse(body).results_found;
                //console.log('Found:' + resultsCount);
                //session.send('I have found ' + resultsCount + ' restaurants for you!');
                var results = JSON.parse(body).restaurants;
                //console.log(results);
                var msg = presentInCards(session, results);
                session.send(msg);
                session.endDialog();
            }
        }
    
    request(options,callback);
}



function getCuisineId(cuisine, location){
    var cuisine_id = null;
    for (var i=0; i < cuisines.length; i++){
        var c = cuisines[i].cuisine;
        if (c.cuisine_name == cuisine){
            cuisineId = c.cuisine_id;
            break;
        }
    }
    console.log('Found:' + cuisineId);
    return cuisineId;
}



function getCuisines(cityId){
    
    var options = {
        uri: baseURL + 'cuisines',
        headers: {
            'user-key': apiKey
        },
        qs: {'city_id':cityId},
        method: 'GET'
        }
    var callback = function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            } else {
                console.log(body);
                cuisines = JSON.parse(body).cuisines;
                
            }
        }
    
    request(options,callback);
}

function getCategoryId(category){
    var category_id = null;
    for (var i=0; i < categories.length; i++){
        var c = categories[i].categories;
        if (c.name == category){
            category_id = c.id;
            break;
        }
    }
    console.log('Found:' + category_id);
    return category_id;
}

function getCategories(){
    var options = {
        uri: baseURL + 'categories',
        headers: {
            'user-key': apiKey
        },
        qs: {},
        method: 'GET'
        }
    var callback = function(error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            } else {
                console.log(body);
                categories = JSON.parse(body).categories;
            }
        }
    
    request(options,callback);
}

function presentInCards(session, results){
    
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    
    var heroCardArray = [];
    var l = results.length;
    if (results.length > 10){
        l = 10;
    }
    for (var i = 0; i < l; i++){
        var r = results[i].restaurant;
        
        var herocard = new builder.HeroCard(session)
            .title(r.name)
            .subtitle(r.location.address)
            .text(r.user_rating.aggregate_rating)
            .images([builder.CardImage.create(session, r.thumb)])
            .buttons([
                builder.CardAction.imBack(session, "book_table:" + r.id, "Book a table")
            ]);
        heroCardArray.push(herocard);

    }
    
    msg.attachments(heroCardArray);
    
    return msg;
}