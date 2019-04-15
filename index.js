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
      console.log("Got results");
      console.log("Found!");
      console.log(res.data);
      errorContainer.innerHTML = "";
      loading = false;
      displayResults(res.data);
      resultsContainer.classList.remove("hidden");
    }, error: function(XMLHttpRequest, textStatus, errorThrown) {
      if (XMLHttpRequest.status == 0) {
        console.log(' Check Your Network.');
      } else if (XMLHttpRequest.status == 404) {
        console.log("Got results");
        console.log("Not found");
        displayError("Мы не знаем такого пользователя");
      } else if (XMLHttpRequest.status == 500) {
        console.log('Internel Server Error.');
      }  else {
        console.log('Unknow Error.\n' + XMLHttpRequest.responseText);
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
  frequencyContainer.innerHTML = resultsObj.mostFrequentWords;
};

displayError = (errorText) => {
  errorContainer.innerHTML = errorText;
};
