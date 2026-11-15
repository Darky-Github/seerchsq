"use strict";

const API_URL = "https://see-api-ulzn.onrender.com";
const ANNOUNCEMENTS_URL = "./announcements.json";

const homeSearchForm = document.getElementById("homeSearchForm");
const homeSearchInput = document.getElementById("homeSearchInput");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

const safeSearchToggle = document.getElementById("safeSearchToggle");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const tabs = document.querySelectorAll(".tab");
const pageButtons = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");

const results = document.getElementById("results");
const status = document.getElementById("status");
const loading = document.getElementById("loading");

const announcementPreview = document.getElementById("announcementPreview");
const announcementsList = document.getElementById("announcementsList");

let currentQuery = "";
let currentTab = "web";
let currentResults = [];
let currentImages = [];
let currentVideos = [];
let searchController = null;
let searchRequestNumber = 0;

function showPage(pageName) {
  const pageId = `${pageName}Page`;
  const targetPage = document.getElementById(pageId);

  if (!targetPage) return;

  pages.forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  pageButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

pageButtons.forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

function setTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";

  document.documentElement.dataset.theme = selectedTheme;

  if (themeIcon) {
    themeIcon.textContent = selectedTheme === "dark" ? "☀" : "☾";
  }

  if (themeToggle) {
    const nextTheme = selectedTheme === "dark" ? "light" : "dark";

    themeToggle.setAttribute(
      "aria-label",
      `Switch to ${nextTheme} mode`
    );
  }

  try {
    localStorage.setItem("seerchs-theme", selectedTheme);
  } catch {
  }
}

function initializeTheme() {
  let savedTheme = "light";

  try {
    savedTheme = localStorage.getItem("seerchs-theme") || "light";
  } catch {
    savedTheme = "light";
  }

  setTheme(savedTheme);
}

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme;
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

function getSafeSearchLevel() {
  return safeSearchToggle?.checked ? "strict" : "moderate";
}

function initializeSafeSearch() {
  if (!safeSearchToggle) return;

  let savedLevel = "strict";

  try {
    savedLevel = localStorage.getItem("seerchs-safe-search") || "strict";
  } catch {
    savedLevel = "strict";
  }

  safeSearchToggle.checked = savedLevel !== "moderate";
}

safeSearchToggle?.addEventListener("change", () => {
  const level = getSafeSearchLevel();

  try {
    localStorage.setItem("seerchs-safe-search", level);
  } catch {
  }

  if (currentQuery) {
    search(currentQuery);
  }
});

async function search(query) {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) {
    status.textContent = "Enter something to search for.";
    return;
  }

  currentQuery = cleanQuery;

  if (searchController) {
    searchController.abort();
  }

  searchController = new AbortController();

  const requestNumber = ++searchRequestNumber;

  setLoading(true);
  status.textContent = "";
  results.replaceChildren();

  currentResults = [];
  currentImages = [];
  currentVideos = [];

  searchInput.value = cleanQuery;
  homeSearchInput.value = cleanQuery;

  const safeLevel = getSafeSearchLevel();

  const params = new URLSearchParams({
    q: cleanQuery,
    page: "1",
    limit: "20",
    safe: safeLevel
  });

  const url = `${API_URL}/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: searchController.signal,
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Search request failed: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (requestNumber !== searchRequestNumber) return;

    if (!data || !Array.isArray(data.results)) {
      throw new Error("The API returned an unexpected response.");
    }

    currentResults = data.results;

    currentImages = collectImages(data);
    currentVideos = collectVideos(data);

    renderCurrentTab();

    const total = currentResults.length;

    status.textContent = total
      ? `${total} web results for "${cleanQuery}"`
      : `No results found for "${cleanQuery}"`;

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("q", cleanQuery);

    window.history.replaceState({}, "", newUrl);

  } catch (error) {
    if (error.name === "AbortError") return;

    console.error("Search error:", error);

    status.textContent = "Something went wrong while searching.";

    results.replaceChildren();

    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = error.message || "Unable to reach the search API.";

    results.appendChild(message);

  } finally {
    if (requestNumber === searchRequestNumber) {
      setLoading(false);
    }
  }
}

function collectImages(data) {
  const images = [];

  if (Array.isArray(data.images)) {
    images.push(...data.images);
  }

  for (const result of data.results || []) {
    if (Array.isArray(result.images)) {
      images.push(...result.images);
    }
  }

  return images;
}

function collectVideos(data) {
  const videos = [];

  if (Array.isArray(data.videos)) {
    videos.push(...data.videos);
  }

  for (const result of data.results || []) {
    if (Array.isArray(result.videos)) {
      videos.push(...result.videos);
    }
  }

  return videos;
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    currentTab = tab.dataset.tab;

    tabs.forEach(item => {
      item.classList.toggle("active", item === tab);
    });

    renderCurrentTab();
  });
});

function renderCurrentTab() {
  results.replaceChildren();

  if (currentTab === "web") {
    renderWebResults(currentResults);
    return;
  }

  if (currentTab === "images") {
    renderImages(currentImages);
    return;
  }

  if (currentTab === "videos") {
    renderVideos(currentVideos);
  }
}

function renderWebResults(items) {
  if (!items.length) {
    showEmptyState("No web results available.");
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "result-card";

    const url = safeUrl(
      item.url || item.link || item.href
    );

    const title = item.title || item.name || "Untitled result";
    const snippet = item.snippet || item.description || item.content || "";

    const display = document.createElement("span");
    display.className = "result-url";
    display.textContent = url ? displayUrl(url) : "";

    const heading = document.createElement("a");
    heading.className = "result-title";
    heading.textContent = title;

    if (url) {
      heading.href = url;
      heading.target = "_blank";
      heading.rel = "noopener noreferrer";
    } else {
      heading.removeAttribute("href");
    }

    const description = document.createElement("p");
    description.className = "result-snippet";
    description.textContent = snippet;

    card.append(display, heading, description);

    fragment.appendChild(card);
  }

  results.appendChild(fragment);
}

function renderImages(items) {
  if (!items.length) {
    showEmptyState("No images available.");
    return;
  }

  const grid = document.createElement("div");
  grid.className = "image-grid";

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    const imageUrl = safeUrl(
      item.imageUrl ||
      item.image_url ||
      item.thumbnail ||
      item.thumbnailUrl ||
      item.url
    );

    if (!imageUrl) continue;

    const sourceUrl = safeUrl(
      item.sourceUrl ||
      item.source_url ||
      item.pageUrl ||
      item.page_url ||
      item.link
    );

    const card = document.createElement(sourceUrl ? "a" : "div");
    card.className = "image-card";

    if (sourceUrl) {
      card.href = sourceUrl;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = item.title || "Search result image";
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";

    image.addEventListener("error", () => {
      card.remove();
    }, { once: true });

    const info = document.createElement("div");
    info.className = "image-card-info";

    const title = document.createElement("div");
    title.className = "image-card-title";
    title.textContent = item.title || "Image";

    const source = document.createElement("div");
    source.className = "image-card-source";

    const sourceName = item.sourceTitle ||
      item.source_title ||
      item.source ||
      (sourceUrl ? displayUrl(sourceUrl) : "");

    source.textContent = sourceName;

    info.append(title, source);
    card.append(image, info);
    fragment.appendChild(card);
  }

  grid.appendChild(fragment);

  if (!grid.children.length) {
    showEmptyState("No usable images were returned.");
    return;
  }

  results.appendChild(grid);
}

function renderVideos(items) {
  if (!items.length) {
    showEmptyState("No videos available.");
    return;
  }

  const grid = document.createElement("div");
  grid.className = "video-grid";

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    const videoUrl = safeUrl(
      item.url ||
      item.videoUrl ||
      item.video_url ||
      item.link
    );

    if (!videoUrl) continue;

    const thumbnailUrl = safeUrl(
      item.thumbnail ||
      item.thumbnailUrl ||
      item.thumbnail_url ||
      item.image
    );

    const card = document.createElement("a");
    card.className = "video-card";
    card.href = videoUrl;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    if (thumbnailUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "video-thumbnail";
      thumbnail.src = thumbnailUrl;
      thumbnail.alt = "";
      thumbnail.loading = "lazy";
      thumbnail.referrerPolicy = "no-referrer";

      thumbnail.addEventListener("error", () => {
        thumbnail.remove();
      }, { once: true });

      card.appendChild(thumbnail);
    }

    const info = document.createElement("div");
    info.className = "video-info";

    const title = document.createElement("div");
    title.className = "video-title";
    title.textContent = item.title || "Untitled video";

    const source = document.createElement("div");
    source.className = "video-source";
    source.textContent = item.source || item.channel || displayUrl(videoUrl);

    info.append(title, source);
    card.appendChild(info);

    fragment.appendChild(card);
  }

  grid.appendChild(fragment);

  if (!grid.children.length) {
    showEmptyState("No usable videos were returned.");
    return;
  }

  results.appendChild(grid);
}

function safeUrl(value) {
  if (!value || typeof value !== "string") return null;

  try {
    const url = new URL(value, window.location.href);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function displayUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function showEmptyState(message) {
  const element = document.createElement("p");
  element.className = "empty-state";
  element.textContent = message;
  results.appendChild(element);
}

function setLoading(isLoading) {
  loading.hidden = !isLoading;
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (!query) return;

  currentTab = "web";

  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === "web");
  });

  showPage("search");
  search(query);
});

homeSearchForm.addEventListener("submit", event => {
  event.preventDefault();

  const query = homeSearchInput.value.trim();

  if (!query) return;

  currentTab = "web";

  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === "web");
  });

  showPage("search");
  search(query);
});

async function loadAnnouncements() {
  try {
    const response = await fetch(
      `${ANNOUNCEMENTS_URL}?t=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Unable to load announcements.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid announcements format.");
    }

    const announcements = [...data].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }

      return String(b.date || "").localeCompare(String(a.date || ""));
    });

    renderAnnouncementPreview(announcements.slice(0, 3));
    renderAnnouncementList(announcements);

  } catch (error) {
    console.warn("Announcements:", error.message);

    const message = "Announcements are currently unavailable.";

    if (announcementPreview) {
      announcementPreview.textContent = message;
    }

    if (announcementsList) {
      announcementsList.textContent = message;
    }
  }
}

function createAnnouncementCard(item) {
  const card = document.createElement("article");
  card.className = "announcement-card";

  const topline = document.createElement("div");
  topline.className = "announcement-topline";

  const category = document.createElement("span");
  category.className = "announcement-category";
  category.textContent = item.category || "Update";

  const date = document.createElement("span");
  date.className = "announcement-date";
  date.textContent = formatDate(item.date);

  topline.append(category, date);

  if (item.pinned) {
    const pinned = document.createElement("span");
    pinned.className = "announcement-pinned";
    pinned.textContent = "Pinned";
    topline.appendChild(pinned);
  }

  const heading = document.createElement("h3");
  heading.textContent = item.title || "Untitled announcement";

  const content = document.createElement("p");
  content.textContent = item.content || "";

  card.append(topline, heading, content);

  return card;
}

function renderAnnouncementPreview(items) {
  if (!announcementPreview) return;

  announcementPreview.replaceChildren();

  if (!items.length) {
    announcementPreview.textContent = "No announcements yet.";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    fragment.appendChild(createAnnouncementCard(item));
  }

  announcementPreview.appendChild(fragment);
}

function renderAnnouncementList(items) {
  if (!announcementsList) return;

  announcementsList.replaceChildren();

  if (!items.length) {
    announcementsList.textContent = "No announcements yet.";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    fragment.appendChild(createAnnouncementCard(item));
  }

  announcementsList.appendChild(fragment);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function initialize() {
  initializeTheme();
  initializeSafeSearch();

  loadAnnouncements();

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");

  if (initialQuery && initialQuery.trim()) {
    showPage("search");
    search(initialQuery);
  } else {
    showPage("home");
  }
}

initialize();
