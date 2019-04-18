const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const http = require('http').Server(app);
const request = require('request');
const parser = require('xml2json');
const striptags = require('striptags');
const natural = require('natural');
const tokenizer = new natural.AggressiveTokenizerRu({language: "ru"});
const sw = require('stopword');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.raw());

const sortByValue = (obj) => {
  // Convert object into array
	let sortable = [];

	for(let key in obj) {
    if (obj.hasOwnProperty(key)) {
      sortable.push([key, obj[key]]);
    }
  }

	// Sort items by value
	sortable.sort(function(a, b) {
	  return b[1]-a[1]; // compare numbers
	});

	return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
};

const wordsFrequency = (wordsArray) => {
  let result = {};

  for (let i=0; i<wordsArray.length; i++) {
    if (result[wordsArray[i]]) {
      result[wordsArray[i]]++;
    } else {
      result[wordsArray[i]] = 1;
    }
  }

  return result;
};

const languageDiversity = (text) => {
  // Remove HTML tags from resulting string
  text = striptags(text).toLowerCase();

  // Create an array of all words
  let allWords = tokenizer.tokenize(text);

  const customStopwords = ["и", "который", "которая", "которые", "которое", "которым", "которых", "все", "всё", "всех", "всего", "всеми", "всем", "его", "ее", "её", "их", "ими", "них", "ними", "nbsp", "mdash", "quot", "laquo", "raquo"];

  // Remove Russian stopwords
  let meaningfulWords = sw.removeStopwords(allWords, sw.ru);

  // Remove custom stopwords
  meaningfulWords = sw.removeStopwords(meaningfulWords, customStopwords);

	// Remove one-letter words
	let meaningfulWordsPure = [];

	for (let i=0; i<meaningfulWords.length; i++) {
		if (meaningfulWords[i].length > 1) {
			meaningfulWordsPure.push(meaningfulWords[i]);
		}
	}

  // Stem each word in the array
  const stemmedWords = meaningfulWordsPure.map(x => natural.PorterStemmerRu.stem(x));

  // Get 10 most frequent words
  const wordsFrequencyObj = wordsFrequency(meaningfulWordsPure);
  const mostFrequentWords = sortByValue(wordsFrequencyObj).slice(0, 10);

  // Remove duplicates
  const uniqueWords = Array.from(new Set(stemmedWords));

  // Calculate resulting text diversity
  // TODO: Maybe use allWords instead of meaningfulWords?
  const diversity = (uniqueWords.length / meaningfulWordsPure.length).toFixed(2);

  return {"diversity": diversity, "mostFrequentWords": mostFrequentWords};
};

app.get('/posts/:user', (req, res) => {
  let user = req.params.user;
  let allPosts = "";

  // Get user's latest posts via LJ API
  const options = {
    url: `http://${user}.livejournal.com/data/atom`,
    headers: {
     'Cache-Control': 'max-age=3600'
    }
  };

  request.get(options, function(err, response, body) {
    if (err) {
			console.log("Something went wrong!")
      console.log(err);
      return;
    } else if (response.statusCode == "404") {
			res.status(404).send("Not found");
			return;
		}

    responseJSON = parser.toJson(response.body.toString(), { object: true });
    let allEntries = responseJSON.feed.entry;

    // Concatenate all posts into one string
    for (let i=0; i<allEntries.length; i++) {
      allPosts += allEntries[i].content["$t"];
    }

    const result = {
      data: languageDiversity(allPosts)
    };

    res.send(JSON.stringify(result));
  });
});

var port = process.env.PORT || 3000;

var server = http.listen(port, () => {
  console.log('Server is running on port', server.address().port);
});
