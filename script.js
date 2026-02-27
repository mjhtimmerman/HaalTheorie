// ----------------------------
// HaalTheorie Chat Widget Script
// - Verbergt chat op LearnWorlds course player (path-player / courseid+unit / playerFrame)
// - SPA-proof: root class + !important CSS + history hooks + MutationObserver
// - Webhook secret header verwijderd (wordt niet gecontroleerd)
// ----------------------------

// ---- helpers / selectors (alleen declaraties; query's doen we in init) ----
let welcomeShown = false;

// Disable chat on LearnWorlds course player pages
function shouldDisableChatOnThisPage() {
  const path = location.pathname.toLowerCase();
  const qs = location.search.toLowerCase();

  if (path.includes("path-player")) return true;
  if (qs.includes("courseid=") && qs.includes("unit=")) return true;

  return false;
}

// persistent visitor id (browser/device scope)
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

// LearnWorlds identity (email) if present
function getUserEmail() {
  const el = document.querySelector("#lw-identity");
  const email = el?.dataset?.email?.trim();
  return email || null;
}

// device info
function getDeviceType() {
  const w = Math.min(window.innerWidth, window.screen?.width || window.innerWidth);
  if (w <= 767) return "mobile";
  if (w <= 1024) return "tablet";
  return "desktop";
}
function isTouchDevice() {
  return ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
}

// safe link rendering (Markdown + raw URLs)
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

  // markdown links: [text](https://...)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>'
  );

  // raw URLs
  html = html.replace(/(?<!["'=\]])\bhttps?:\/\/[^\s<)]+/g, (url) =>
    `<a href="${url}" target="_blank" rel="noopener nofollow">${url}</a>`
  );

  html = html.replace(/\n/g, "<br>");
  return html;
}

// ---- hide-mode (course pages) ----
const HIDE_CLASS = "ht-hide-chat";
const HIDE_STYLE_ID = "ht-hide-chat-css";

function ensureHideCSS() {
  if (document.getElementById(HIDE_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = HIDE_STYLE_ID;
  style.textContent = `
    .${HIDE_CLASS} .chat-launcher-container,
    .${HIDE_CLASS} .chat-launcher,
    .${HIDE_CLASS} .chat-window,
    .${HIDE_CLASS} .chat-intro-bubble {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

function enableHideMode() {
  ensureHideCSS();
  document.documentElement.classList.add(HIDE_CLASS);
}

function disableHideMode() {
  document.documentElement.classList.remove(HIDE_CLASS);
}

// ---- chat init (non-course pages) ----
let chatInitialized = false;

function initChatIfNeeded() {
  if (chatInitialized) return;

  const launcher = document.querySelector(".chat-launcher");
  const introBubble = document.querySelector(".chat-intro-bubble");
  const chatWindow = document.querySelector(".chat-window");
  const closeBtn = document.querySelector(".close-chat");
  const sendBtn = document.querySelector(".chat-input button");
  const input = document.querySelector(".chat-input textarea");
  const messages = document.querySelector(".chat-messages");

  // Als de UI nog niet in de DOM zit (late inject), dan later opnieuw proberen via boot()
  if (!launcher || !chatWindow || !closeBtn || !sendBtn || !input || !messages) return;

  // Session ID genereren / hergebruiken
  let sessionId = localStorage.getItem("chatSessionId");
  if (!sessionId) {
    sessionId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("chatSessionId", sessionId);
  }

  // Typing indicator
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

    // User message
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

        // identifiers
        visitorId: visitorId,
        userEmail: userEmail,
        userKeyType: userEmail ? "email" : null,

        // device/page context
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

// ---- SPA boot logic ----
function isCourseContext() {
  // shouldDisableChatOnThisPage() dekt URL, playerFrame dekt LearnWorlds iframe player
  return shouldDisableChatOnThisPage() || !!document.getElementById("playerFrame");
}

function boot() {
  if (isCourseContext()) {
    enableHideMode();
  } else {
    disableHideMode();
    initChatIfNeeded(); // init pas op niet-course pagina's
  }
}

// init
boot();

// triggers
window.addEventListener("load", boot);
window.addEventListener("popstate", boot);

// history hooks (SPA)
const _push = history.pushState;
history.pushState = function () { _push.apply(this, arguments); boot(); };

const _replace = history.replaceState;
history.replaceState = function () { _replace.apply(this, arguments); boot(); };

// observe DOM changes (late inject)
const obs = new MutationObserver(boot);
obs.observe(document.documentElement, { childList: true, subtree: true });

// (optioneel) disconnect na 2 minuten om overhead te limiteren
setTimeout(() => obs.disconnect(), 120000);
