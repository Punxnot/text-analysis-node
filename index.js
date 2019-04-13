const userInput = document.getElementById("name");
const sendButton = document.getElementById("sendButton");

$(() => {
  // Get user input
  sendButton.addEventListener("click", () => {
    let queryString = sanitize(userInput.value);
    getPosts(queryString);
  });
});

getPosts = (userName) => {
  console.log("Sending request...");
  $.get(`posts/${userName}`, (data) => {
    console.log(data);
  })
};

sanitize = (string) => {
  var output = string.replace(/<script[^>]*?>.*?<\/script>/gi, '').
			 replace(/<[\/\!]*?[^<>]*?>/gi, '').
			 replace(/<style[^>]*?>.*?<\/style>/gi, '').
			 replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '').
       trim();
  return output;
};
