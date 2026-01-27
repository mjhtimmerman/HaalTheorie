const launcher = document.querySelector(".chat-launcher");
const introBubble = document.querySelector(".chat-intro-bubble");
const chatWindow = document.querySelector(".chat-window");
const closeBtn = document.querySelector(".close-chat");
const sendBtn = document.querySelector(".chat-input button");
const input = document.querySelector(".chat-input textarea");
const messages = document.querySelector(".chat-messages");
const WEBHOOK_SECRET = "mccmurWaT5p4MsZNXwm2N32N5mQ5nNwno92tVbz5egD0EZ2ZkexcEhLUTJrp4XY7b";

let welcomeShown = false;

// NEW — helpers voor veilige link-rendering (Markdown en losse URLs)
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function mdLinksToHTML(str) {
  // 1) alles escapen
  let html = escapeHTML(str);

  // 2) markdown links: [tekst](https://...)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>'
  );

  // 3) losse URLs klikbaar maken (skip already-in-attrs)
  html = html.replace(/(?<!["'=\]])\bhttps?:\/\/[^\s<)]+/g, (url) =>
    `<a href="${url}" target="_blank" rel="noopener nofollow">${url}</a>`
  );

  // 4) nieuwe regels behouden
  html = html.replace(/\n/g, "<br>");
  return html;
}

// Session ID genereren / hergebruiken
let sessionId = localStorage.getItem("chatSessionId");
if (!sessionId) {
  sessionId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("chatSessionId", sessionId);
}

// Typing indicator element
const typingIndicator = document.createElement("div");
typingIndicator.className = "typing-indicator";
typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

function showTypingIndicator() {
  // verwijder eerst als er al een indicator bestaat
  if (typingIndicator.parentElement) typingIndicator.remove();
  messages.appendChild(typingIndicator);
  typingIndicator.style.display = "inline-block";
  messages.scrollTop = messages.scrollHeight;
}
function hideTypingIndicator() {
  typingIndicator.style.display = "none";
}

function openChat() {
  chatWindow.style.display = "flex";

  // introBubble bestaat niet meer → veilig afhandelen
  if (introBubble) introBubble.style.display = "none";

  if (!welcomeShown) {
    const botContainer = document.createElement("div");
    botContainer.className = "bot-message-container";

    const botAvatar = document.createElement("img");
    botAvatar.src = "https://raw.githubusercontent.com/mjhtimmerman/HaalTheorie/main/Trengo%20Widget.png";
    botAvatar.className = "bot-avatar";

    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.innerText = "Nawfal hier 👋 Waar kan ik je mee helpen?";

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
    userMsg.innerText = text; // user blijft plain text (veilig)
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    // Typing indicator na 0.2s tonen
    setTimeout(showTypingIndicator, 200);

    // POST naar n8n webhook inclusief sessionId
    fetch("https://haaltheorie.app.n8n.cloud/webhook/17025913-81df-4927-882d-9eeb1373d686/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", 
                "X-Webhook-Secret": "WEBHOOK_SECRET" 
               },
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
      // Typing indicator verbergen zodra antwoord binnenkomt
      hideTypingIndicator();

      const botContainer = document.createElement("div");
      botContainer.className = "bot-message-container";

      const botAvatar = document.createElement("img");
      botAvatar.src = "https://raw.githubusercontent.com/mjhtimmerman/HaalTheorie/main/Trengo%20Widget.png";
      botAvatar.className = "bot-avatar";

      const botMsg = document.createElement("div");
      botMsg.className = "message bot";

      // NEW — raw string bepalen en veilig omzetten naar klikbare HTML
      const raw =
        data.reply ||
        data.answer ||
        (data.messages && data.messages[0]?.text) ||
        data.output ||
        (typeof data === "string" ? data : JSON.stringify(data)) ||
        "Geen antwoord ontvangen.";

      botMsg.innerHTML = mdLinksToHTML(raw); // << klikbare links

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
const closeIntroBtn = document.querySelector(".close-intro");

if (closeIntroBtn) {
  closeIntroBtn.addEventListener("click", () => {
    if (introBubble) introBubble.style.display = "none";
    localStorage.setItem("introDismissed", "true");
  });
}


