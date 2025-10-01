// seo-script.js
const seoContainer = document.querySelector("#seo-bot");
const seoMessages = document.createElement("div");
seoMessages.className = "chat-messages";
seoContainer.appendChild(seoMessages);

const seoInputArea = document.createElement("div");
seoInputArea.className = "chat-input";
seoInputArea.innerHTML = `
  <textarea placeholder="Stel je vraag..."></textarea>
  <button>➤</button>
`;
seoContainer.appendChild(seoInputArea);

const seoInput = seoInputArea.querySelector("textarea");
const seoSendBtn = seoInputArea.querySelector("button");

let seoSessionId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);

function seoSendMessage() {
  const text = seoInput.value.trim();
  if (!text) return;

  // User message
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.innerText = text;
  seoMessages.appendChild(userMsg);
  seoMessages.scrollTop = seoMessages.scrollHeight;

  // POST naar n8n webhook
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
    seoMessages.appendChild(botContainer);
    seoMessages.scrollTop = seoMessages.scrollHeight;
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
