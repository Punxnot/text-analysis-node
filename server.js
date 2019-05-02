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
const Morphy = require('phpmorphy').default;

const POSTSNUMBER = 25;
const CHECKPOINT = 10000;

const customStopwords = ["c","а","без","более","больше","большой","будем","будет","будете","будешь","буду","будут","будь","бы","бывает","был","была","были","было","быть","в","вам","вами","вас","ваш","ваша","ваше","ваши","ведь","весь","вне","во","вообще","вот","все","всем","всеми","всему","всех","всего","всею","всю","вся","всё","вы","г","где","да","даже","для","до","его","ее","если","еще","ещё","ею","её","же","за","зато","зачем","здесь","и","из","или","им","ими","их","к","каждая","каждое","каждые","каждый","как","какая","какие","какого","какой","какое","кем","когда","кого","ком","кому","конечно","которая","которого","которой","которое","которые","которым","который","которых","кроме","кто","куда","ли","лишь","меня","мимо","мне","много","мной","мною","мои","мой","моя","моё","мы","на","над","надо","наиболее","наконец","нам","нами","нас","наш","наша","наше","наши","не","него","нее","ней","нем","нему","нет","нею","неё","ни","нибудь","ним","ними","них","но","ну","нх","о","об","около","он","она","они","оно","от","очень","перед","по","под","пор","после","потому","почему","почти","при","про","сам","сама","сами","самим","самими","самих","само","самого","самой","самом","самому","саму","самый","свое","своём","своё","своего","своей","своему","свои","своя","своими","своих","свой","свою","своею","себе","себя","сих","со","собой","собою","та","так","такая","также","таки","такие","такое","такой","там","твои","твой","твоя","твоё","те","тебе","тебя","тем","теми","тех","то","тобой","тобою","того","тоже","только","том","тому","тот","тою","ту","туда","тут","ты","уж","уже","хоть","хотя","чего","чем","чему","через","что","чтоб","чтобы","чуть","эта","эти","этим","этими","этих","это","этого","этой","этом","этому","этот","эту","nbsp", "mdash", "ndash", "quot", "laquo", "raquo", "hellip"];

const easterNames = ["mozgosteb", "bearinbloodbath", "adscripta"];

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.raw());

const morphy = new Morphy('ru', {
  storage:             Morphy.STORAGE_MEM,
  predict_by_suffix:   true,
  predict_by_db:       true,
  graminfo_as_text:    true,
  use_ancodes_cache:   false,
  resolve_ancodes:     Morphy.RESOLVE_ANCODES_AS_TEXT
});

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
	  return b[1]-a[1];
	});

	return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
};

const purifyText = (allWords) => {
	// Get rid of stopwords
	let meaningfulWords = sw.removeStopwords(allWords, sw.ru);
	meaningfulWords = sw.removeStopwords(meaningfulWords, customStopwords);

	let meaningfulWordsPure = [];

	// Get rid of one-letter words; standartize words
	for (let i=0; i<meaningfulWords.length; i++) {
		if (meaningfulWords[i].length > 1) {
			let wordOptions = morphy.lemmatize(meaningfulWords[i]);
			if (wordOptions[0]) {
				meaningfulWordsPure.push(wordOptions[0]);
			}
		}
	}

	return meaningfulWordsPure;
};

const wordsFrequency = (allWords) => {
	let meaningfulWordsPure = purifyText(allWords);
  let result = {};

  for (let i=0; i<meaningfulWordsPure.length; i++) {
    if (result[meaningfulWordsPure[i]]) {
      result[meaningfulWordsPure[i]]++;
    } else {
      result[meaningfulWordsPure[i]] = 1;
    }
  }

  return result;
};

const languageDiversity = (text, name) => {
	const isEaster = easterNames.includes(name);

  // Remove HTML tags from resulting string
  text = striptags(text).toLowerCase();

	// Get array of all words
	let allWords = tokenizer.tokenize(text);

	// Calculate average post length
	const averagePostLength = Math.round(allWords.length / POSTSNUMBER);

	// Calculate number of whole thousands
	let maxWholeWords = Math.floor(allWords.length / 1000) * 1000;

	// Get 10 most frequent words
  const wordsFrequencyObj = wordsFrequency(allWords);
  const mostFrequentWords = sortByValue(wordsFrequencyObj).slice(0, 10);

	// Truncate long text to standard length
	allWords = allWords.slice(0, CHECKPOINT + 1);

  // Remove stop words and lemmatize
	const allMeaningfullWords = purifyText(allWords);

  // Remove duplicates
  const uniqueWords = Array.from(new Set(allMeaningfullWords));

  // Calculate resulting text diversity
  let diversity = +(uniqueWords.length / allWords.length).toFixed(3);

	if (maxWholeWords < 1000) {
		diversity = "недоступно";
	} else if (maxWholeWords >= 10000) {
		// Leave diversity as is, it's accurate enough
		diversity = diversity.toFixed(3);
	} else {
		// Use logarithmic dependence equation to predict diversity in check point
		// based on incomplete data
		let correction = 1.0098 - 0.1088 * Math.log(maxWholeWords);
		diversity = (diversity - correction).toFixed(3);
	}

  return {"diversity": diversity, "mostFrequentWords": mostFrequentWords, "isEaster": isEaster, "averagePostLength": averagePostLength, "name": name};
};

app.get('/posts/:user', (req, res) => {
  const user = req.params.user;
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

		if (allEntries && allEntries.length && allEntries[0].content && allEntries[0].content["$t"]) {
			// Concatenate all posts into one string
	    for (let i=0; i<allEntries.length; i++) {
	      allPosts += allEntries[i].content["$t"];
	    }

	    const result = {
	      data: languageDiversity(allPosts, user)
	    };

	    res.send(JSON.stringify(result));
		} else {
			res.status(406).send("No public entries");
		}
  });
});

var port = process.env.PORT || 3000;

var server = http.listen(port, () => {
  console.log('Server is running on port', server.address().port);
});
