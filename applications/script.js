const button = document.getElementById("openAI");
const chatbox = document.getElementById("chatbox");

button.addEventListener("click", () => {

if(chatbox.style.display === "none" || chatbox.style.display === "") {
    chatbox.style.display = "block";
} else {
    chatbox.style.display = "none";
}

});
