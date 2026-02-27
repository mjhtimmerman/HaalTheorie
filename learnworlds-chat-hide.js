(function () {
  const CHAT_SELECTORS = [
    ".chat-launcher-container",
    ".chat-launcher",
    ".chat-window",
    ".chat-intro-bubble",
  ];

  const HIDE_STYLE_ID = "lw-chat-force-hide-style";
  const HIDDEN_ATTR = "data-lw-chat-force-hidden";

  function shouldDisableChatOnThisPage() {
    const url = new URL(window.location.href);
    const path = (url.pathname || "").toLowerCase();
    const query = (url.search || "").toLowerCase();
    const hash = (url.hash || "").toLowerCase();

    const isPathPlayer = path.includes("path-player");
    const hasCourseAndUnit =
      /(courseid|course_id|course\/)/.test(path + query + hash) &&
      /(unit|lesson|activity)/.test(path + query + hash);

    return isPathPlayer || hasCourseAndUnit;
  }

  function ensureHideCss() {
    if (document.getElementById(HIDE_STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = HIDE_STYLE_ID;
    style.textContent = `${CHAT_SELECTORS.join(",")} { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }`;
    document.head.appendChild(style);
  }

  function removeHideCss() {
    const existing = document.getElementById(HIDE_STYLE_ID);
    if (existing) {
      existing.remove();
    }
  }

  function hideChatUiNow() {
    CHAT_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.setAttribute(HIDDEN_ATTR, "1");
        element.style.setProperty("display", "none", "important");
        element.style.setProperty("visibility", "hidden", "important");
        element.style.setProperty("opacity", "0", "important");
        element.style.setProperty("pointer-events", "none", "important");
      });
    });
  }

  function unhideChatUiNow() {
    CHAT_SELECTORS.forEach((selector) => {
      document.querySelectorAll(`${selector}[${HIDDEN_ATTR}='1']`).forEach((element) => {
        element.removeAttribute(HIDDEN_ATTR);
        element.style.removeProperty("display");
        element.style.removeProperty("visibility");
        element.style.removeProperty("opacity");
        element.style.removeProperty("pointer-events");
      });
    });
  }

  function applyCurrentPageState() {
    if (shouldDisableChatOnThisPage()) {
      ensureHideCss();
      hideChatUiNow();
      return;
    }

    removeHideCss();
    unhideChatUiNow();
  }

  let isApplyScheduled = false;
  function scheduleApply() {
    if (isApplyScheduled) {
      return;
    }

    isApplyScheduled = true;
    requestAnimationFrame(() => {
      isApplyScheduled = false;
      applyCurrentPageState();
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "childList" ||
        (mutation.type === "attributes" && mutation.target instanceof Element)
      ) {
        scheduleApply();
        return;
      }
    }
  });

  function startObserver() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  }

  function patchHistoryEvents() {
    const { pushState, replaceState } = history;

    history.pushState = function (...args) {
      const result = pushState.apply(this, args);
      window.dispatchEvent(new Event("lw:navigation"));
      return result;
    };

    history.replaceState = function (...args) {
      const result = replaceState.apply(this, args);
      window.dispatchEvent(new Event("lw:navigation"));
      return result;
    };
  }

  function bootstrap() {
    applyCurrentPageState();
    startObserver();

    // Early and late passes for third-party injectors.
    [50, 250, 1000, 2500].forEach((delay) => {
      setTimeout(scheduleApply, delay);
    });

    window.addEventListener("load", scheduleApply);
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("hashchange", scheduleApply);
    window.addEventListener("lw:navigation", scheduleApply);
  }

  patchHistoryEvents();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
