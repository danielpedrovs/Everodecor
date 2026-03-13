const button = document.getElementById("openAI");
const chatbox = document.getElementById("chatbox");

button.addEventListener("click", () => {

if(chatbox.style.display === "block"){
    chatbox.style.display = "none";
} else {
    chatbox.style.display = "block";
}

});
