const userInput = document.getElementById("name");
const sendButton = document.getElementById("sendButton");
const resultsContainer = document.getElementById("resultsContainer");
const diversityContainer = document.querySelector("#diversity .result-value");
const frequencyContainer = document.querySelector("#frequency .result-value");
const errorContainer = document.getElementById("errorContainer");
let loading = false;

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

getPosts = (userName) => {
  loading = true;
  resultsContainer.classList.add("hidden");

  $.ajax({
    url: `posts/${userName}`,
    success: function(res) {
      res = JSON.parse(res);
      errorContainer.innerHTML = "";
      loading = false;
      displayResults(res.data);
      resultsContainer.classList.remove("hidden");
    }, error: function(XMLHttpRequest, textStatus, errorThrown) {
      if (XMLHttpRequest.status == 0) {
        console.error(' Check Your Network.');
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

sanitize = (string) => {
  var output = string.replace(/<script[^>]*?>.*?<\/script>/gi, '').
			 replace(/<[\/\!]*?[^<>]*?>/gi, '').
			 replace(/<style[^>]*?>.*?<\/style>/gi, '').
			 replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '').
       trim();
  return output;
};

displayResults = (resultsObj) => {
  diversityContainer.innerHTML = resultsObj.diversity;
  frequencyContainer.innerHTML = "";
  frequencyContainer.innerHTML += "<br>";
  for (let i=0; i<resultsObj.mostFrequentWords.length; i++) {
    frequencyContainer.innerHTML += `${resultsObj.mostFrequentWords[i][0]}<br>`;
  }
};

displayError = (errorText) => {
  errorContainer.innerHTML = errorText;
};
