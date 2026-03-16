const openButton = document.getElementById("openAI");
const chatbox = document.getElementById("chatbox");
const closeBtn = document.getElementById("closeChat");


openBtn.addEventListener("click", () => {
  chatbox.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
  chatbox.style.display = "none";
});
