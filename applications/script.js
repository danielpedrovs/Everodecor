const openAI = document.getElementById("openAI");
const chatbox = document.getElementById("chatbox");

if(openAI){
openAI.addEventListener("click", () => {

if(chatbox.style.display === "block"){
chatbox.style.display = "none";
}else{
chatbox.style.display = "block";
}

});
}

