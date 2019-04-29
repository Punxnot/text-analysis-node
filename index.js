const userInput = document.getElementById("name");
const sendButton = document.getElementById("sendButton");
const resultsContainer = document.getElementById("resultsContainer");
const diversityContainer = document.querySelector("#diversity .result-value");
const frequencyContainer = document.querySelector("#frequency .result-value");
const averageLengthContainer = document.querySelector("#averageLength .result-value");
const errorContainer = document.getElementById("errorContainer");
const loader = document.querySelector(".loader");

$(() => {
  // Get user input
  sendButton.addEventListener("click", () => {
    let queryString = sanitize(userInput.value);
    getPosts(queryString);
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.keyCode == 13) {
      let queryString = sanitize(userInput.value);
      getPosts(queryString);
    }
  });
});

const getPosts = (userName) => {
  hideEaster();
  switchLoader(true);
  resultsContainer.classList.add("hidden");

  $.ajax({
    url: `posts/${userName}`,
    success: function(res) {
      res = JSON.parse(res);
      errorContainer.innerHTML = "";
      document.body.classList.remove("not-found");
      switchLoader(false);
      displayResults(res.data);
      resultsContainer.classList.remove("hidden");
    }, error: function(XMLHttpRequest, textStatus, errorThrown) {
      switchLoader(false);
      if (XMLHttpRequest.status == 0) {
        console.error("Check Your Network.");
      } else if (XMLHttpRequest.status == 404) {
        console.error("Not found");
        displayError("Мы не знаем такого пользователя");
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
  if (resultsObj.isEaster) {
    showEaster(resultsObj.name);
  }

  diversityContainer.innerHTML = resultsObj.diversity;
  const numWord = getNumWord(resultsObj.averagePostLength);
  averageLengthContainer.innerHTML = `${resultsObj.averagePostLength} ${numWord}`;
  frequencyContainer.innerHTML = "";
  frequencyContainer.innerHTML += "<br>";
  for (let i=0; i<resultsObj.mostFrequentWords.length; i++) {
    frequencyContainer.innerHTML += `${resultsObj.mostFrequentWords[i][0]}<br>`;
  }
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

const showEaster = (userName) => {
  document.body.classList.add(userName);
};

const hideEaster = () => {
  document.body.className = "";
};
