// seo-script.js
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

  seoMessages.appendChild(container);
  seoMessages.scrollTop = seoMessages.scrollHeight;
}

function seoSendMessage() {
  const text = seoInput.value.trim();
  if (!text) return;

  appendMessage(text, false);

  fetch("https://matstimmerman.app.n8n.cloud/webhook/1dc55584-0033-429e-9788-d03458ee20b7/chat?context=seo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, sessionId: seoSessionId })
  })
    .then(async res => {
      try { return await res.json(); }
      catch { return { reply: await res.text() }; }
    })
    .then(data => {
      appendMessage(
        data.reply || data.answer || (data.messages && data.messages[0]?.text) || data.output || "Geen antwoord ontvangen.",
        true
      );
    })
    .catch(err => console.error("Fout bij SEO-chat:", err));

  seoInput.value = "";
}

seoSendBtn.addEventListener("click", seoSendMessage);
seoInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    seoSendMessage();
  }
});

// ✅ Startbericht in dezelfde stijl als floating versie
appendMessage(
  "Nawfal van HaalTheorie hier 👋 Waar kan ik je mee helpen?",
  true
);
