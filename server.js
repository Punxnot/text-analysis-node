const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const http = require('http').Server(app);
const request = require('request');
const parser = require('xml2json');
const striptags = require('striptags');
const natural = require('natural');
const tokenizer = new natural.AggressiveTokenizerRu({language: "ru"});

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.raw());

const languageDiversity = (text) => {
  // Remove HTML tags from resulting string
  text = striptags(text).toLowerCase();

  // Create an array of all words
  let allWords = tokenizer.tokenize(text);
  console.log("All words number:");
  console.log(allWords.length);

  // Stem each word in the array
  const stemmedWords = allWords.map(x => natural.PorterStemmerRu.stem(x));

  // Remove duplicates
  const uniqueWords = Array.from(new Set(stemmedWords));
  console.log("Unique words number:");
  console.log(uniqueWords.length);

  // Calculate resulting text diversity
  const diversity = uniqueWords.length / allWords.length;

  return diversity;
};

app.get('/posts/:user', (req, res) => {
  let user = req.params.user;
  console.log(user);
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
      console.log(err);
      return;
    }

    responseJSON = parser.toJson(response.body.toString(), { object: true });
    let allEntries = responseJSON.feed.entry;

    // Concatenate all posts into one string
    for (let i=0; i<allEntries.length; i++) {
      allPosts += allEntries[i].content["$t"];
    }

    const result = {
      diversity: languageDiversity(allPosts)
    };
    console.log(JSON.stringify(result));
    console.log("================");

    res.send(JSON.stringify(result));
  });
});

var port = process.env.PORT || 3000;

var server = http.listen(port, () => {
  console.log('Server is running on port', server.address().port);
});
