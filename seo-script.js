// seo-script.js (met typindicator en correcte uitlijning)
const seoBot = document.querySelector("#seo-bot");

seoBot.innerHTML = `
  <div class="chat-messages"></div>
  <div class="chat-input">
    <textarea placeholder="Stel je vraag..."></textarea>
    <button>➤</button>
  </div>
`;

const seoMessages = seoBot.querySelector(".chat-messages");
const seoInput = seoBot.querySelector("textarea");
const seoSendBtn = seoBot.querySelector("button");

let seoSessionId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);

// Typindicator aanmaken
const typingIndicator = document.createElement("div");
typingIndicator.className = "typing-indicator";
typingIndicator.innerHTML = `
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>
`;
typingIndicator.style.display = "none";
seoMessages.appendChild(typingIndicator);

function showTypingIndicator() {
  typingIndicator.style.display = "flex";
  seoMessages.scrollTop = seoMessages.scrollHeight;
}

function hideTypingIndicator() {
  typingIndicator.style.display = "none";
}

function appendMessage(text, fromBot = false) {
  const container = document.createElement("div");
  container.className = "bot-message-container";

  if (fromBot) {
    const avatar = document.createElement("img");
    avatar.src = "https://raw.githubusercontent.com/mjhtimmerman/HaalTheorie/main/Trengo%20Widget.png";
    avatar.className = "bot-avatar";
    container.appendChild(avatar);
  }

  const msg = document.createElement("div");
  msg.className = `message ${fromBot ? "bot" : "user"}`;
  msg.innerText = text;
  container.appendChild(msg);

  seoMessages.insertBefore(container, typingIndicator);
  seoMessages.scrollTop = seoMessages.scrollHeight;
}

function seoSendMessage() {
  const text = seoInput.value.trim();
  if (!text) return;

  appendMessage(text, false);
  seoInput.value = "";

  showTypingIndicator();

  fetch("https://haaltheorie.app.n8n.cloud/webhook/17025913-81df-4927-882d-9eeb1373d686/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, sessionId: seoSessionId })
  })
    .then(async res => {
      try { return await res.json(); }
      catch { return { reply: await res.text() }; }
    })
    .then(data => {
      hideTypingIndicator();
      appendMessage(
        data.reply || data.answer || (data.messages && data.messages[0]?.text) || data.output || "Geen antwoord ontvangen.",
        true
      );
    })
    .catch(err => {
      hideTypingIndicator();
      console.error("Fout bij SEO-chat:", err);
    });
}

seoSendBtn.addEventListener("click", seoSendMessage);
seoInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    seoSendMessage();
  }
});

// Startbericht
appendMessage("Nawfal van HaalTheorie hier 👋 Waar kan ik je mee helpen?", true);
