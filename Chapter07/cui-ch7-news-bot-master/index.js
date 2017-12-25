//index.js
//This app listens to tweets and updates the database for every user

var TwitterPackage = require('twitter');
var request = require('request');

var secret = {
  consumer_key: 'YOUR_TWITTER_CONSUMER_KEY',
  consumer_secret: 'YOUR_TWITTER_CONSUMER_SECTRET',
  access_token_key: 'YOUR_TWITTER_ACCESS_TOKEN_KEY',
  access_token_secret: 'YOUR_TWITTER_ACCESS_TOKEN_SECRET'
}

var Twitter = new TwitterPackage(secret);

console.log("Hello World! I am a twitter bot!");

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://YOUR_DB_USERNAME:YOUR_DB_PWD@YOUR_DB_URL/twitterbot';

//listening ot incoming tweets 
Twitter.stream('user', {}, function(stream) {
    stream.on('data', function(tweet) {
        //console.log(tweet); 
        //this stream get all data posted to the user including the tweets on the timeline from other people it is following.
        var ct = /@chatbotguru/i;
        var userUtt = 'null';
        if (tweet.text.search(ct) != -1){
            userUtt = tweet.text.replace(ct, '');
            console.log('Tweet Msg:' + userUtt);
            console.log('Tweet from:' + '@' + tweet.user.screen_name);
            
            var userInterest = getInterestedGenre(userUtt);
            var userSentiment = getSentiment(userUtt);
            
            var user = { 'screen_name' : tweet.user.screen_name, 
                        'user_interest' : userInterest};
            
            console.log(user);
            
            // Use connect method to connect to the server
            MongoClient.connect(url, function(err, db) {
               console.log("Connected successfully to server");
               var collection = db.collection('users');
               if (userSentiment == 'positive'){
                   collection.insertMany([user], function(err, result) {
                        if (err){
                            console.log(err); 
                        } else  { console.log("Inserted a user interest into the collection");
                            db.close();
                        }
                    });
               } else {
                   collection.deleteOne(user, function(err, result) {
                        console.log(err);
                        console.log("Deleted a user interest from the collection");
                        db.close();
                    });
               }
            });
        }
        
        if (tweet.direct_message){
            console.log('We got a direct message from:' + tweet.direct_message.sender.screen_name);
            console.log(tweet); 
        }
    });
}); 
 
function getSentiment(text){
    if (text.search('not interested') != -1){
        return 'negative';
    }
    if (text.search('no more') != -1){
        return 'negative';
    }
    if (text.search('don\'t send') != -1){
        return 'negative';
    }
    if (text.search('no ') != -1){
        return 'negative';
    }
    if (text.search('dont like ') != -1){
        return 'negative';
    }
    if (text.search('unsubscribe ') != -1){
        return 'negative';
    }
    if (text.search('don\'t follow ') != -1){
        return 'negative';
    }
    if (text.search('stop ') != -1){
        return 'negative';
    }
    return 'positive';
}

function getInterestedGenre(text){
    
    
    if (text.search('tech') != -1 || text.search('technology') != -1 ){
        return 'technology';
    }
    else if (text.search('all kinds') != -1){
        return 'general';
    }
    else if (text.search('politics') != -1 || text.search('political') != -1){
        return 'politics';
    }
    else if (text.search('sports') != -1){
        return 'sport';
    }
    else if (text.search('business') != -1){
        return 'business';
    }
}

      