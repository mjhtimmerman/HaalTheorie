// seo-script.js (met typindicator fix + veilige link-rendering)
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

// ---------- Helpers: veilige link-rendering (Markdown + losse URLs) ----------
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function mdLinksToHTML(str) {
  let html = escapeHTML(str);

  // [label](https://...)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>'
  );

  // losse URLs -> links (geen dubbele matches in attributes)
  html = html.replace(/(?<!["'=\]])\bhttps?:\/\/[^\s<)]+/g, (url) =>
    `<a href="${url}" target="_blank" rel="noopener nofollow">${url}</a>`
  );

  // nieuwe regels behouden
  html = html.replace(/\n/g, "<br>");
  return html;
}

// ---------- Typindicator ----------
let typingIndicator = document.createElement("div");
typingIndicator.className = "typing-indicator";
typingIndicator.setAttribute("aria-live", "polite");
typingIndicator.innerHTML = `
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>
`;
typingIndicator.style.display = "none";
seoMessages.appendChild(typingIndicator);

function ensureTypingIndicatorAtEnd() {
  // zorg dat de indicator altijd als laatste in de lijst staat
  if (typingIndicator.parentElement !== seoMessages) {
    seoMessages.appendChild(typingIndicator);
  } else if (seoMessages.lastElementChild !== typingIndicator) {
    seoMessages.appendChild(typingIndicator);
  }
}
function showTypingIndicator() {
  ensureTypingIndicatorAtEnd();
  typingIndicator.style.display = "flex";
  seoMessages.scrollTop = seoMessages.scrollHeight;
}
function hideTypingIndicator() {
  typingIndicator.style.display = "none";
}

// ---------- Berichten ----------
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

  if (fromBot) {
    // BOT: klikbare links + veilige rendering
    msg.innerHTML = mdLinksToHTML(text);
  } else {
    // USER: plain text (veilig)
    msg.textContent = text;
  }

  // altijd vóór de typindicator invoegen zodat die onderaan blijft
  ensureTypingIndicatorAtEnd();
  seoMessages.insertBefore(container, typingIndicator);
  container.appendChild(msg);

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

      const raw =
        data.reply ||
        data.answer ||
        (data.messages && data.messages[0]?.text) ||
        data.output ||
        "Geen antwoord ontvangen.";

      appendMessage(raw, true);
    })
    .catch(err => {
      hideTypingIndicator();
      console.error("Fout bij SEO-chat:", err);
      appendMessage("Er ging iets mis. Probeer het later nog eens.", true);
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
