var express = require('express');
var request = require('request');
var app = express();
var router = express.Router();
var nconf = require('nconf');

nconf.env().file({ file: 'config.json' });
var apikey = nconf.get("appannie_apikey");
var androidProductID = nconf.get("appannie_androidProductID");
var iosProductID = nconf.get("appannie_iosProductID");
console.log('apikey is ' + apikey);
console.log('androidProductID is ' + androidProductID);
console.log('iosProductID is ' + iosProductID);

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
};

function removeIgnoredWordsFromStr(str, ignoredWords) {
        ignoredWords.forEach(function(elem){
                str = str.replace(new RegExp(elem, 'g'), "");
        });
        return str;
}

function wordCloudForString(str) {
        var natural = require('natural');
        var TfIdf = natural.TfIdf;
        var tfidf = new TfIdf();

        var ignoredWords = ["app", "guardian", "when ", "so ", "not ", "no ", "null ", "just "];
        var filteredStr = removeIgnoredWordsFromStr(str, ignoredWords);
        
	console.log(filteredStr)
        tfidf.addDocument(filteredStr);

        var wordCloud = [];
        tfidf.listTerms(0).forEach(function(item) {
                wordCloud.push({text: item.term, size: clamp(parseFloat(item.tfidf)*30, 10, 65)})
        });

        return wordCloud.slice(0, 15);
}


router.get('/android/:start_date/:end_date/:rating', function(req, res) {
  var options = {
    url: 'https://api.appannie.com/v1.2/apps/google-play/app/' + androidProductID  + '/reviews?start_date=' + req.params.start_date + '&end_date=' + req.params.end_date + '&rating=' + req.params.rating,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + apikey
    }
  };

  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body);
      //res.json({ message: 'hooray! welcome to our api!' });
      var str = obj.reviews.map(function(elem) {
        return elem.title + elem.text;
      }).join(" ").replace(/\W/g, ' ').toLowerCase();

      var wordCloud = wordCloudForString(str);
      obj.wordCloud = wordCloud;
      console.log("yep" + JSON.stringify(obj.wordCloud))
      res.json(JSON.stringify(obj));
    }
  });
});

app.set('port', (process.env.PORT || 5000));
app.use('/api', router);
app.use(express.static('public'));
app.listen(app.get('port'), function() {
	  console.log('Node app is running on port', app.get('port'));
});
