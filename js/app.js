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
    feedbackBtn: document.getElementById("feedbackBtn")
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
    el.categoryScroll.innerHTML = "";
    cats.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "pill" + (cat === state.activeCategory ? " is-active" : "");
      btn.textContent = cat;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat === state.activeCategory ? "true" : "false");
      btn.addEventListener("click", () => setActiveCategory(cat));
      el.categoryScroll.appendChild(btn);
    });
  }

  function setActiveCategory(cat) {
    if (cat === state.activeCategory) return;
    state.activeCategory = cat;
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

  const PLACEHOLDER_SVG =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#12161c"/>
        <g stroke="#232a33" stroke-width="1.5">
          <line x1="0" y1="60" x2="400" y2="60"/>
          <line x1="0" y1="120" x2="400" y2="120"/>
          <line x1="0" y1="180" x2="400" y2="180"/>
          <line x1="0" y1="240" x2="400" y2="240"/>
        </g>
        <circle cx="200" cy="150" r="34" fill="none" stroke="#35e0a6" stroke-width="3"/>
        <path d="M182 150 l14 14 l24 -30" fill="none" stroke="#35e0a6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    );

  function buildCard(article, isEnd) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.link = article.link;

    const hasImage = article.image && article.image !== "No Image Available";

    card.innerHTML = `
      <div class="card__media">
        <img alt="" loading="lazy" src="${hasImage ? escapeAttr(article.image) : PLACEHOLDER_SVG}">
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
      img.addEventListener("error", () => { img.src = PLACEHOLDER_SVG; img.classList.add("is-loaded"); });
    } else {
      img.classList.add("is-loaded");
    }

    return card;
  }

  function buildEndCard() {
    const div = document.createElement("div");
    div.className = "deck-end";
    div.innerHTML = `
      <div class="deck-end__mark">📡</div>
      <div class="deck-end__title">You're all caught up</div>
      <div class="deck-end__body">No unread stories left in this category. New ones land daily at 6am IST.</div>
      <button class="deck-end__btn" id="resetFromEnd">Reset read history</button>
    `;
    div.querySelector("#resetFromEnd").addEventListener("click", clearReadHistory);
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

  function scrollToIndex(i) {
    const h = el.deck.clientHeight;
    el.deck.scrollTo({ top: i * h, behavior: "smooth" });
  }

  function onKeydown(e) {
    if (el.aboutOverlay.classList.contains("is-open")) {
      if (e.key === "Escape") closeAbout();
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

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  wireEvents();
  boot();
})();
