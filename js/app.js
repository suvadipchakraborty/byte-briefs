/**
 * ByteBriefs — app.js
 * Vanilla ES6+. No build step, no framework. Everything below is written
 * to run directly as a static file on Cloudflare Pages.
 */
(() => {
  "use strict";

  // ---------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------

  const SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpbSXMZ-9eJoCoRr6YPpvcRdX1SJQUH-hXiclDlWILHR_qoSl1YrvfWLXC-Qeab753Dk356TaQ2JO6/pub?gid=0&single=true&output=csv";

  const CATEGORY_ORDER = [
    "All News",
    "Core Data Science & ML",
    "Data Governance & Architecture",
    "Enterprise & Agentic AI",
    "Data Leadership & Strategy",
    "Data Engineering & Pipelines",
    "Banking & Financial Analytics",
    "Data Visualization & Interactive Analytics",
    "AI Workflows & Prompt Engineering",
    "Tech Culture & Workplace Dynamics",
    "Industry Events & Forums"
  ];

  const LS_KEYS = {
    read: "bytebriefs.read",
    bookmarks: "bytebriefs.bookmarks",
    cache: "bytebriefs.cache"
  };

  const FEEDBACK_EMAIL = "suvadipchakraborty@gmail.com";
  const THEME_KEY = "bytebriefs.theme";

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY) || "dark"; } catch { return "dark"; }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", theme === "light" ? "#f7f8fa" : "#0a0d12");
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "light" ? "dark" : "light";
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    applyTheme(next);
  }

  // Apply immediately — before DOM refs are grabbed — so there's no flash of
  // the wrong theme on load.
  applyTheme(getStoredTheme());

  // ---------------------------------------------------------------------
  // Tiny persisted-set helper (localStorage-backed Set of URLs)
  // ---------------------------------------------------------------------

  function loadSet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  function saveSet(key, set) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch {
      /* storage full or unavailable — degrade silently */
    }
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  const state = {
    all: [],               // every article, newest first
    activeCategory: "All News",
    deck: [],              // unread articles for the active category
    currentIndex: 0,
    readSet: loadSet(LS_KEYS.read),
    bookmarkSet: loadSet(LS_KEYS.bookmarks),
    todayKey: null
  };

  // ---------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------

  const el = {
    deck: document.getElementById("deck"),
    categoryScroll: document.getElementById("categoryScroll"),
    counterText: document.getElementById("counterText"),
    toast: document.getElementById("toast"),
    shareBtn: document.getElementById("shareBtn"),
    bookmarkBtn: document.getElementById("bookmarkBtn"),
    aboutBtn: document.getElementById("aboutBtn"),
    aboutOverlay: document.getElementById("aboutOverlay"),
    aboutClose: document.getElementById("aboutClose"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),
    feedbackBtn: document.getElementById("feedbackBtn"),
    themeToggle: document.getElementById("themeToggle"),
    installBtn: document.getElementById("installBtn"),
    installOverlay: document.getElementById("installOverlay"),
    installClose: document.getElementById("installClose")
  };

  // ---------------------------------------------------------------------
  // CSV parsing (handles quoted fields containing commas/newlines)
  // ---------------------------------------------------------------------

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field); field = "";
      } else if (c === "\n") {
        row.push(field); rows.push(row); row = []; field = "";
      } else if (c === "\r") {
        // skip
      } else {
        field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(cell => cell.trim() !== ""));
  }

  function rowsToArticles(rows) {
    if (!rows.length) return [];
    const header = rows[0].map(h => h.trim().toLowerCase());
    const idx = {
      date: header.indexOf("date fetched"),
      category: header.indexOf("category"),
      headline: header.indexOf("headline"),
      image: header.indexOf("image url"),
      preview: header.indexOf("preview"),
      link: header.indexOf("article link")
    };
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;
      const link = (r[idx.link] || "").trim();
      const headline = (r[idx.headline] || "").trim();
      if (!link || !headline) continue;
      out.push({
        date: (r[idx.date] || "").trim(),
        category: (r[idx.category] || "").trim(),
        headline,
        image: (r[idx.image] || "").trim(),
        preview: (r[idx.preview] || "").trim(),
        link
      });
    }
    return out;
  }

  function normalizeMockData() {
    return window.BYTEBRIEFS_MOCK_DATA.map(a => ({ ...a }));
  }

  // ---------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------

  async function loadArticles() {
    try {
      const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("bad status " + res.status);
      const text = await res.text();
      const articles = rowsToArticles(parseCSV(text));
      if (!articles.length) throw new Error("empty sheet");
      try { localStorage.setItem(LS_KEYS.cache, JSON.stringify(articles)); } catch {}
      return { articles, source: "live" };
    } catch (err) {
      try {
        const cached = localStorage.getItem(LS_KEYS.cache);
        if (cached) {
          const articles = JSON.parse(cached);
          if (articles.length) return { articles, source: "cache" };
        }
      } catch {}
      return { articles: normalizeMockData(), source: "mock" };
    }
  }

  function sortNewestFirst(articles) {
    return [...articles].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  // ---------------------------------------------------------------------
  // Rendering: category pills
  // ---------------------------------------------------------------------

  function renderCategoryPills() {
    const present = new Set(state.all.map(a => a.category));
    const cats = CATEGORY_ORDER.filter(c => c === "All News" || present.has(c));
    const descriptors = [
      { key: SAVED_KEY, label: "★ Saved" },
      ...cats.map(c => ({ key: c, label: c }))
    ];
    el.categoryScroll.innerHTML = "";
    descriptors.forEach(({ key, label }) => {
      const btn = document.createElement("button");
      btn.className = "pill" + (key === state.activeCategory ? " is-active" : "");
      btn.textContent = label;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", key === state.activeCategory ? "true" : "false");
      btn.addEventListener("click", () => setActiveCategory(key));
      el.categoryScroll.appendChild(btn);
    });
  }

  function setActiveCategory(key) {
    if (key === state.activeCategory) return;
    state.activeCategory = key;
    renderCategoryPills();
    buildDeck();
    el.deck.scrollTop = 0;
    state.currentIndex = 0;
    updateCounter();
  }

  // ---------------------------------------------------------------------
  // Deck building / dedupe
  // ---------------------------------------------------------------------

  function buildDeck() {
    if (state.activeCategory === SAVED_KEY) {
      state.deck = state.all.filter(a => state.bookmarkSet.has(a.link));
      renderDeck();
      return;
    }
    const scoped = state.activeCategory === "All News"
      ? state.all
      : state.all.filter(a => a.category === state.activeCategory);
    state.deck = scoped.filter(a => !state.readSet.has(a.link));
    renderDeck();
  }

  function readTimeLabel(article) {
    const words = (article.headline + " " + article.preview).trim().split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `~${mins} min read`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const SAVED_KEY = "__SAVED__";

  const PLACEHOLDER_SRC = "./assets/placeholder.svg";

  function buildCard(article, isEnd) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.link = article.link;

    const hasImage = article.image && article.image !== "No Image Available";

    card.innerHTML = `
      <div class="card__media">
        <img alt="" loading="lazy" src="${hasImage ? escapeAttr(article.image) : PLACEHOLDER_SRC}">
        <div class="card__media-gradient"></div>
        <div class="card__meta-row">
          <span class="card__source-pill">${escapeHtml(article.category || "ByteBriefs")}</span>
          <span class="card__date">${escapeHtml(formatDate(article.date))}</span>
          <span class="card__readtime">${readTimeLabel(article)}</span>
        </div>
      </div>
      <div class="card__body">
        <h2 class="card__headline">${escapeHtml(article.headline)}</h2>
        <p class="card__preview">${escapeHtml(article.preview || "No preview available for this story.")}</p>
        <a class="card__readmore" href="${escapeAttr(article.link)}" target="_blank" rel="noopener noreferrer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <path d="M15 3h6v6"/><path d="M10 14L21 3"/>
          </svg>
          Read the full story
        </a>
      </div>
    `;

    const img = card.querySelector("img");
    if (hasImage) {
      img.addEventListener("load", () => img.classList.add("is-loaded"));
      img.addEventListener("error", () => { img.src = PLACEHOLDER_SRC; img.classList.add("is-loaded"); });
    } else {
      img.classList.add("is-loaded");
    }

    return card;
  }

  function buildEndCard() {
    const isSaved = state.activeCategory === SAVED_KEY;
    const div = document.createElement("div");
    div.className = "deck-end";
    if (isSaved) {
      div.innerHTML = `
        <div class="deck-end__mark">🔖</div>
        <div class="deck-end__title">No saved stories yet</div>
        <div class="deck-end__body">Tap the bookmark icon while reading a brief to save it here.</div>
      `;
    } else {
      div.innerHTML = `
        <div class="deck-end__mark">📡</div>
        <div class="deck-end__title">You're all caught up</div>
        <div class="deck-end__body">No unread stories left in this category. New ones land daily at 6am IST.</div>
        <button class="deck-end__btn" id="resetFromEnd">Reset read history</button>
      `;
      div.querySelector("#resetFromEnd").addEventListener("click", clearReadHistory);
    }
    return div;
  }

  function renderDeck() {
    el.deck.innerHTML = "";
    if (!state.deck.length) {
      el.deck.appendChild(buildEndCard());
      updateCounter();
      return;
    }
    state.deck.forEach(a => el.deck.appendChild(buildCard(a)));
    el.deck.appendChild(buildEndCard());
    updateCounter();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

  // ---------------------------------------------------------------------
  // Counter — "today" batch vs total, scoped to the active category
  // ---------------------------------------------------------------------

  function updateCounter() {
    if (state.activeCategory === SAVED_KEY) {
      const pos = state.deck.length ? Math.min(state.currentIndex + 1, state.deck.length) : 0;
      el.counterText.innerHTML = `<b>${pos}</b>/${state.deck.length} saved`;
      return;
    }
    const scoped = state.activeCategory === "All News"
      ? state.all
      : state.all.filter(a => a.category === state.activeCategory);

    const todayTotal = state.todayKey
      ? scoped.filter(a => a.date === state.todayKey).length
      : scoped.length;
    const total = scoped.length;

    const pos = Math.min(state.currentIndex + 1, Math.max(state.deck.length, 1));
    const posDisplay = state.deck.length ? pos : 0;

    el.counterText.innerHTML =
      `<b>${posDisplay}</b>/${todayTotal} today &nbsp;•&nbsp; <b>${posDisplay}</b>/${total} total`;
  }

  // ---------------------------------------------------------------------
  // Scroll tracking, read-marking, haptics
  // ---------------------------------------------------------------------

  let scrollRaf = null;

  function onDeckScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      const h = el.deck.clientHeight || 1;
      const idx = Math.round(el.deck.scrollTop / h);
      if (idx !== state.currentIndex) {
        const passedIndex = Math.min(state.currentIndex, state.deck.length - 1);
        if (idx > state.currentIndex && passedIndex >= 0 && state.deck[passedIndex]) {
          markRead(state.deck[passedIndex]);
        }
        state.currentIndex = idx;
        vibrate();
        updateCounter();
        updateBookmarkButtonState();
      }
    });
  }

  function markRead(article) {
    if (!article || state.readSet.has(article.link)) return;
    state.readSet.add(article.link);
    saveSet(LS_KEYS.read, state.readSet);
  }

  function vibrate() {
    try { if (navigator.vibrate) navigator.vibrate(10); } catch {}
  }

  function clearReadHistory() {
    state.readSet = new Set();
    saveSet(LS_KEYS.read, state.readSet);
    buildDeck();
    el.deck.scrollTop = 0;
    state.currentIndex = 0;
    showToast("Read history cleared");
  }

  // ---------------------------------------------------------------------
  // Bookmarks / share / toast
  // ---------------------------------------------------------------------

  function currentArticle() {
    return state.deck[Math.min(state.currentIndex, state.deck.length - 1)] || null;
  }

  function updateBookmarkButtonState() {
    const a = currentArticle();
    el.bookmarkBtn.classList.toggle("is-active", !!a && state.bookmarkSet.has(a.link));
  }

  function toggleBookmark() {
    const a = currentArticle();
    if (!a) return;
    if (state.bookmarkSet.has(a.link)) {
      state.bookmarkSet.delete(a.link);
      showToast("Removed bookmark");
    } else {
      state.bookmarkSet.add(a.link);
      showToast("Saved");
    }
    saveSet(LS_KEYS.bookmarks, state.bookmarkSet);
    if (state.activeCategory === SAVED_KEY) {
      const keepIndex = Math.min(state.currentIndex, state.deck.length - 2);
      buildDeck();
      state.currentIndex = Math.max(0, keepIndex);
      scrollToIndex(state.currentIndex, false);
    }
    updateBookmarkButtonState();
  }

  async function shareCurrent() {
    const a = currentArticle();
    if (!a) return;
    const payload = { title: a.headline, text: a.preview, url: a.link };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      throw new Error("no share api");
    } catch {
      try {
        await navigator.clipboard.writeText(a.link);
        showToast("Link copied");
      } catch {
        showToast("Couldn't share this story");
      }
    }
  }

  let toastTimer = null;
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 1800);
  }

  // ---------------------------------------------------------------------
  // About modal
  // ---------------------------------------------------------------------

  function openAbout() { el.aboutOverlay.classList.add("is-open"); }
  function closeAbout() { el.aboutOverlay.classList.remove("is-open"); }

  // ---------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------

  function scrollToIndex(i, smooth = true) {
    const h = el.deck.clientHeight;
    el.deck.scrollTo({ top: i * h, behavior: smooth ? "smooth" : "auto" });
  }

  function onKeydown(e) {
    if (el.aboutOverlay.classList.contains("is-open")) {
      if (e.key === "Escape") closeAbout();
      return;
    }
    if (el.installOverlay.classList.contains("is-open")) {
      if (e.key === "Escape") closeInstallOverlay();
      return;
    }
    const maxIndex = el.deck.children.length - 1;
    if (e.key === "ArrowDown" || e.key === "j" || e.key === "J") {
      scrollToIndex(Math.min(state.currentIndex + 1, maxIndex));
    } else if (e.key === "ArrowUp" || e.key === "k" || e.key === "K") {
      scrollToIndex(Math.max(state.currentIndex - 1, 0));
    } else if (e.key === "b" || e.key === "B") {
      toggleBookmark();
    }
  }

  // ---------------------------------------------------------------------
  // Add to Home Screen
  // ---------------------------------------------------------------------

  let deferredInstallPrompt = null;

  function isStandaloneDisplay() {
    return window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
  }

  function isIOSDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function openInstallOverlay() { el.installOverlay.classList.add("is-open"); }
  function closeInstallOverlay() { el.installOverlay.classList.remove("is-open"); }

  async function handleInstallClick() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (choice && choice.outcome === "accepted") el.installBtn.hidden = true;
      return;
    }
    if (isIOSDevice()) {
      openInstallOverlay();
      return;
    }
    showToast("Look for \"Install app\" in your browser's menu");
  }

  function initInstallPrompt() {
    if (isStandaloneDisplay()) return; // already installed / running as an app

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      el.installBtn.hidden = false;
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      el.installBtn.hidden = true;
      showToast("ByteBriefs installed");
    });

    // beforeinstallprompt never fires on iOS Safari/Chrome, so surface the
    // button there too and fall back to manual Share-sheet instructions.
    if (isIOSDevice()) el.installBtn.hidden = false;
  }

  // ---------------------------------------------------------------------
  // Wire up + boot
  // ---------------------------------------------------------------------

  function wireEvents() {
    el.deck.addEventListener("scroll", onDeckScroll, { passive: true });
    el.shareBtn.addEventListener("click", shareCurrent);
    el.bookmarkBtn.addEventListener("click", toggleBookmark);
    el.aboutBtn.addEventListener("click", openAbout);
    el.aboutClose.addEventListener("click", closeAbout);
    el.aboutOverlay.addEventListener("click", (e) => { if (e.target === el.aboutOverlay) closeAbout(); });
    el.clearHistoryBtn.addEventListener("click", clearReadHistory);
    el.themeToggle.addEventListener("click", toggleTheme);
    el.installBtn.addEventListener("click", handleInstallClick);
    el.installClose.addEventListener("click", closeInstallOverlay);
    el.installOverlay.addEventListener("click", (e) => { if (e.target === el.installOverlay) closeInstallOverlay(); });
    document.addEventListener("keydown", onKeydown);
  }

  async function boot() {
    el.feedbackBtn.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("ByteBriefs Feedback")}`;

    const { articles } = await loadArticles();
    state.all = sortNewestFirst(articles);
    state.todayKey = state.all.length ? state.all[0].date : null;

    renderCategoryPills();
    buildDeck();
    updateBookmarkButtonState();
    initInstallPrompt();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  wireEvents();
  boot();
})();
