const userInput = document.getElementById("name");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const resultsContainer = document.getElementById("resultsContainer");
const diversityContainer = document.querySelector("#diversity .result-value");
const frequencyContainer = document.querySelector("#frequency .result-value");
const averageLengthContainer = document.querySelector("#averageLength .result-value");
const errorContainer = document.getElementById("errorContainer");
const chartsContainer = document.getElementById("chartsContainer");
const loader = document.querySelector(".loader");

let lengthChart = null;
let diversityChart = null;

$(() => {
  userInput.focus();

  // Get user input
  sendButton.addEventListener("click", () => {
    let queryString = sanitize(userInput.value);
    getPosts(queryString);
  });

  // Watch Enter event
  userInput.addEventListener("keydown", (e) => {
    if (e.keyCode == 13) {
      let queryString = sanitize(userInput.value);
      getPosts(queryString);
    }
  });

  // Clear input
  clearButton.addEventListener("click", () => {
    userInput.value = "";
    userInput.focus();
  });
});

const getPosts = (userName) => {
  switchLoader(true);
  resultsContainer.classList.add("hidden");
  chartsContainer.classList.add("hidden");

  $.ajax({
    url: `posts/${userName}`,
    success: function(res) {
      res = JSON.parse(res);
      errorContainer.innerHTML = "";
      document.body.classList.remove("not-found");
      switchLoader(false);
      displayResults(res.data);
      resultsContainer.classList.remove("hidden");
      chartsContainer.classList.remove("hidden");
    }, error: function(XMLHttpRequest, textStatus, errorThrown) {
      switchLoader(false);
      if (XMLHttpRequest.status == 0) {
        console.error("Check Your Network.");
      } else if (XMLHttpRequest.status == 404) {
        console.error("Not found");
        displayError("Мы не знаем такого пользователя");
      } else if (XMLHttpRequest.status == 406) {
        console.error("No entries");
        displayError("Недостаточно данных");
      } else if (XMLHttpRequest.status == 500) {
        console.error('Internal Server Error.');
      }  else {
        console.error('Unknow Error.\n' + XMLHttpRequest.responseText);
      }
    }
  });
};

const sanitize = (string) => {
  var output = string.replace(/<script[^>]*?>.*?<\/script>/gi, '').
			 replace(/<[\/\!]*?[^<>]*?>/gi, '').
			 replace(/<style[^>]*?>.*?<\/style>/gi, '').
			 replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '').
       trim();
  return output;
};

const getNumWord = (num) => {
  const numStr = num + "";
  const lastDigit = numStr[numStr.length - 1];
  if (+lastDigit === 1) {
    return "слово";
  } else if ([2, 3, 4].includes(+lastDigit)) {
    return "слова";
  } else {
    return "слов";
  }
};

const displayResults = (resultsObj) => {
  diversityContainer.innerHTML = resultsObj.diversity;
  const numWord = getNumWord(resultsObj.averagePostLength);
  averageLengthContainer.innerHTML = `${resultsObj.averagePostLength} ${numWord}`;
  frequencyContainer.innerHTML = "";
  frequencyContainer.innerHTML += "<br>";

  for (let i=0; i<resultsObj.mostFrequentWords.length; i++) {
    frequencyContainer.innerHTML += `${resultsObj.mostFrequentWords[i][0]}<br>`;
  }

  showDiversityGraph(resultsObj.name, resultsObj.averagePostLength, resultsObj.diversity);
};

const displayError = (errorText) => {
  document.body.classList.add("not-found");
  errorContainer.innerHTML = errorText;
};

const switchLoader = (isLoading) => {
  if (isLoading) {
    loader.classList.remove("hidden");
  } else {
    loader.classList.add("hidden");
  }
};

const sortUsersByPostLength = (obj) => {
	let sortable = [];

	for(let key in obj) {
    if (obj.hasOwnProperty(key)) {
      sortable.push([key, obj[key]]);
    }
  }

	sortable.sort(function(a, b) {
	  return b[1]-a[1];
	});

  let result = {
    labels: [],
    values: []
  };

  for (let i=0; i<sortable.length; i++) {
    result.labels.push(sortable[i][0]);
    result.values.push(sortable[i][1]);
  }

	return result;
};

const showDiversityGraph = (name, postLength, diversity) => {
  // Remove any previous charts
  if (lengthChart) {
    lengthChart.destroy();
  }

  if (diversityChart) {
    diversityChart.destroy();
  }

  const lengthObj = {
    'tema': 98,
    'evo_lutio': 1458,
    [name]: postLength,
    'mozgosteb': 728,
    'bearinbloodbath': 603,
    'andeadd': 423
  };

  const diversityObj = {
    'tema': 184,
    'evo_lutio': 205,
    [name]: diversity,
    'mozgosteb': 238,
    'bearinbloodbath': 234,
    'andeadd': 281
  };

  const sortedLength = sortUsersByPostLength(lengthObj);
  const sortedDiversity = sortUsersByPostLength(diversityObj);

  var ctx = document.getElementById('lengthChart').getContext('2d');

  lengthChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: sortedLength.labels,
          datasets: [{
              label: 'Средняя длина поста',
              data: sortedLength.values,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  }
              }]
          }
      }
  });

  var ctx2 = document.getElementById('diversityChart').getContext('2d');

  diversityChart = new Chart(ctx2, {
      type: 'bar',
      data: {
          labels: sortedDiversity.labels,
          datasets: [{
              label: 'Среднее разнообразие постов',
              data: sortedDiversity.values,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  }
              }]
          }
      }
  });
};
