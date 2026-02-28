// ----------------------------
// HaalTheorie Chat Widget (DOM INJECT + WHITELIST)
// Alleen chat op: /start, /blog*, /verkeersborden*
// Overal anders: widget HTML wordt verwijderd
// ----------------------------

let welcomeShown = false;
let chatInitialized = false;

// ----------------------------
// 1) WHITELIST
// ----------------------------
function shouldEnableChatOnThisPage() {
  const path = location.pathname.toLowerCase();

  if (path === "/start") return true;
  if (path === "/blog" || path.startsWith("/blog/")) return true;
  if (path === "/verkeersborden" || path.startsWith("/verkeersborden/")) return true;

  return false;
}

// ----------------------------
// 2) OPTIONAL ID/DEVICE HELPERS
// ----------------------------
function getVisitorId() {
  const KEY = "ht_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(KEY, id);
  }
  return id;
}

function getUserEmail() {
  const el = document.querySelector("#lw-identity");
  const email = el?.dataset?.email?.trim();
  return email || null;
}

function getDeviceType() {
  const w = Math.min(window.innerWidth, window.screen?.width || window.innerWidth);
  if (w <= 767) return "mobile";
  if (w <= 1024) return "tablet";
  return "desktop";
}

function isTouchDevice() {
  return ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
}

// ----------------------------
// 3) SAFE LINK RENDERING
// ----------------------------
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

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>'
  );

  html = html.replace(/(?<!["'=\]])\bhttps?:\/\/[^\s<)]+/g, (url) =>
    `<a href="${url}" target="_blank" rel="noopener nofollow">${url}</a>`
  );

  html = html.replace(/\n/g, "<br>");
  return html;
}

// ----------------------------
// 4) INJECT / REMOVE HTML
// ----------------------------
function injectChatHTMLOnce() {
  if (document.querySelector(".chat-launcher-container") || document.querySelector(".chat-window")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "ht-chat-root";
  wrapper.innerHTML = `
    <div class="chat-launcher-container">
      <div class="chat-intro-bubble">
        <button class="close-intro" aria-label="Sluit popup">×</button>
        <span class="intro-text">Nawfal hier 👋 Waar kan ik je mee helpen?</span>
      </div>
      <div class="chat-launcher"></div>
    </div>

    <div class="chat-window" style="display:none;">
      <div class="chat-header">
        <img src="https://raw.githubusercontent.com/mjhtimmerman/HaalTheorie/main/logo%20ht.png"
             alt="HaalTheorie Logo" class="chat-logo">
        <button class="close-chat">×</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <textarea rows="1" placeholder="Typ een bericht..."></textarea>
        <button>➤</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);
}

function removeChatHTMLIfPresent() {
  // Verwijder onze root als die bestaat
  document.getElementById("ht-chat-root")?.remove();

  // Fallback: als er nog losse legacy nodes bestaan (van oude embed)
  document.querySelector(".chat-launcher-container")?.remove();
  document.querySelector(".chat-window")?.remove();
}

// ----------------------------
// 5) CHAT LOGIC
// ----------------------------
function initChatIfNeeded() {
  // Als eerder geïnitialiseerd, niet opnieuw listeners zetten
  if (chatInitialized) return;

  const launcher = document.querySelector(".chat-launcher");
  const introBubble = document.querySelector(".chat-intro-bubble");
  const chatWindow = document.querySelector(".chat-window");
  const closeBtn = document.querySelector(".close-chat");
  const sendBtn = document.querySelector(".chat-input button");
  const input = document.querySelector(".chat-input textarea");
  const messages = document.querySelector(".chat-messages");

  if (!launcher || !chatWindow || !closeBtn || !sendBtn || !input || !messages) return;

  let sessionId = localStorage.getItem("chatSessionId");
  if (!sessionId) {
    sessionId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("chatSessionId", sessionId);
  }

  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing-indicator";
  typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

  function showTypingIndicator() {
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
    if (!text) return;

    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.innerText = text;
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(showTypingIndicator, 200);

    const visitorId = getVisitorId();
    const userEmail = getUserEmail();
    const deviceType = getDeviceType();
    const touch = isTouchDevice();

    fetch("https://haaltheorie.app.n8n.cloud/webhook/17025913-81df-4927-882d-9eeb1373d686/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        sessionId: sessionId,

        visitorId: visitorId,
        userEmail: userEmail,
        userKeyType: userEmail ? "email" : null,

        deviceType: deviceType,
        isTouch: touch,
        userAgent: navigator.userAgent,
        pagePath: location.pathname,
        pageHref: location.href
      })
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
      hideTypingIndicator();

      const botContainer = document.createElement("div");
      botContainer.className = "bot-message-container";

      const botAvatar = document.createElement("img");
      botAvatar.src = "https://raw.githubusercontent.com/mjhtimmerman/HaalTheorie/main/Trengo%20Widget.png";
      botAvatar.className = "bot-avatar";

      const botMsg = document.createElement("div");
      botMsg.className = "message bot";

      const raw =
        data.reply ||
        data.answer ||
        (data.messages && data.messages[0]?.text) ||
        data.output ||
        (typeof data === "string" ? data : JSON.stringify(data)) ||
        "Geen antwoord ontvangen.";

      botMsg.innerHTML = mdLinksToHTML(raw);

      botContainer.appendChild(botAvatar);
      botContainer.appendChild(botMsg);
      messages.appendChild(botContainer);
      messages.scrollTop = messages.scrollHeight;
    })
    .catch(err => console.error("Fout bij ophalen:", err));

    input.value = "";
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

  chatInitialized = true;
}

// ----------------------------
// 6) BOOT (SPA-PROOF)
// ----------------------------
function boot() {
  if (shouldEnableChatOnThisPage()) {
    injectChatHTMLOnce();
    initChatIfNeeded();
  } else {
    // Hard remove: geen launcher mogelijk op course pages
    removeChatHTMLIfPresent();
  }
}

boot();

window.addEventListener("load", boot);
window.addEventListener("popstate", boot);

const _push = history.pushState;
history.pushState = function () { _push.apply(this, arguments); boot(); };

const _replace = history.replaceState;
history.replaceState = function () { _replace.apply(this, arguments); boot(); };

const obs = new MutationObserver(boot);
obs.observe(document.documentElement, { childList: true, subtree: true });

setTimeout(() => obs.disconnect(), 120000);
