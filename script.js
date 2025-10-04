const launcher = document.querySelector(".chat-launcher");
const introBubble = document.querySelector(".chat-intro-bubble");
const chatWindow = document.querySelector(".chat-window");
const closeBtn = document.querySelector(".close-chat");
const sendBtn = document.querySelector(".chat-input button");
const input = document.querySelector(".chat-input textarea");
const messages = document.querySelector(".chat-messages");

let welcomeShown = false;

// Session ID genereren / hergebruiken
let sessionId = localStorage.getItem("chatSessionId");
if (!sessionId) {
  sessionId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("chatSessionId", sessionId);
}

function openChat() {
  chatWindow.style.display = "flex";
  introBubble.style.display = "none";

  if (!welcomeShown) {
    const botContainer = document.createElement("div");
    botContainer.className = "bot-message-container";

    const botAvatar = document.createElement("img");
    botAvatar.src = "https://raw.githubusercontent.com/mjhtimmerman/HaalTheorie/main/Trengo%20Widget.png";
    botAvatar.className = "bot-avatar";

    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.innerText = "Nawfal van HaalTheorie hier 👋 Waar kan ik je mee helpen?";

    botContainer.appendChild(botAvatar);
    botContainer.appendChild(botMsg);
    messages.appendChild(botContainer);
    messages.scrollTop = messages.scrollHeight;

    welcomeShown = true;
  }
}

function closeChat() {
  chatWindow.style.display = "none";
}
launcher.addEventListener("click", openChat);
closeBtn.addEventListener("click", closeChat);

function sendMessage() {
  const text = input.value.trim();
  if (text !== "") {
    // User message
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.innerText = text;
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    // POST naar n8n webhook inclusief sessionId
    fetch("https://haaltheorie.app.n8n.cloud/webhook/17025913-81df-4927-882d-9eeb1373d686/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId: sessionId })
    })
    .then(async res => {
      try {
        return await res.json();
      } catch {
        const txt = await res.text();
        return { reply: txt };
      }
    })
    .then(data => {
      const botContainer = document.createElement("div");
      botContainer.className = "bot-message-container";

      const botAvatar = document.createElement("img");
      botAvatar.src = "https://raw.githubusercontent.com/mjhtimmerman/HaalTheorie/main/Trengo%20Widget.png";
      botAvatar.className = "bot-avatar";

      const botMsg = document.createElement("div");
      botMsg.className = "message bot";

      botMsg.innerText =
        data.reply ||
        data.answer ||
        (data.messages && data.messages[0]?.text) ||
        data.output || 
        (typeof data === "string" ? data : JSON.stringify(data)) ||
        "Geen antwoord ontvangen.";

      botContainer.appendChild(botAvatar);
      botContainer.appendChild(botMsg);
      messages.appendChild(botContainer);
      messages.scrollTop = messages.scrollHeight;
    })
    .catch(err => console.error("Fout bij ophalen:", err));

    input.value = "";
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
