// const API_URL = "https://seerchsqapi.darkyproton.workers.dev";
const API_URL = "https://see-api-ulzn.onrender.com";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const tabs = document.querySelectorAll(".tab");
const results = document.getElementById("results");
const status = document.getElementById("status");
const loading = document.getElementById("loading");

let currentQuery = "";
let currentTab = "web";
let currentResults = [];
let searchController = null;

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (!query) {
    return;
  }

  search(query);
});

tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    tabs.forEach(function (item) {
      item.classList.remove("active");
    });

    tab.classList.add("active");
    currentTab = tab.dataset.tab;

    renderResults();
  });
});

async function search(query) {
  currentQuery = query;
  searchInput.value = query;

  if (searchController) {
    searchController.abort();
  }

  searchController = new AbortController();

  setLoading(true);
  status.textContent = "";
  results.innerHTML = "";

  const url =
    `${API_URL}/search` +
    `?q=${encodeURIComponent(query)}` +
    `&page=1` +
    `&limit=20`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      signal: searchController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.results)) {
      throw new Error("Invalid API response");
    }

    currentResults = data.results.filter(function (item) {
      return item && typeof item === "object";
    });

    if (typeof data.query === "string" && data.query.trim()) {
      currentQuery = data.query.trim();
      searchInput.value = currentQuery;
    }

    status.textContent =
      `${currentResults.length} ` +
      (currentResults.length === 1 ? "result" : "results");

    renderResults();

    history.replaceState(
      null,
      "",
      `?q=${encodeURIComponent(currentQuery)}`
    );
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error("SEErch² search error:", error);

    currentResults = [];
    status.textContent = "";

    results.innerHTML = `
      <div class="error">
        Search failed. Check that the SEErch² API is reachable.
      </div>
    `;
  } finally {
    setLoading(false);
  }
}

function renderResults() {
  if (!currentQuery) {
    results.innerHTML = `
      <div class="empty">
        Search the web with SEErch².
      </div>
    `;

    return;
  }

  switch (currentTab) {
    case "images":
      renderImages();
      break;

    case "videos":
      renderVideos();
      break;

    case "web":
    default:
      renderWebResults();
      break;
  }
}

function renderWebResults() {
  results.innerHTML = "";

  if (!currentResults.length) {
    results.innerHTML = `
      <div class="empty">
        No results found.
      </div>
    `;

    return;
  }

  currentResults.forEach(function (item) {
    const article = document.createElement("article");
    article.className = "result";

    const url = document.createElement("a");
    url.className = "result-url";
    url.href = safeUrl(item.url);
    url.target = "_blank";
    url.rel = "noopener noreferrer";
    url.textContent = displayUrl(item.url);

    const title = document.createElement("a");
    title.className = "result-title";
    title.href = safeUrl(item.url);
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent =
      item.title ||
      item.url ||
      "Untitled result";

    const description = document.createElement("div");
    description.className = "result-description";
    description.textContent =
      item.description ||
      "No description available.";

    const score = document.createElement("div");
    score.className = "result-score";

    if (typeof item.score === "number") {
      score.textContent =
        `Score: ${formatScore(item.score)}`;
    }

    article.appendChild(url);
    article.appendChild(title);
    article.appendChild(description);

    if (typeof item.score === "number") {
      article.appendChild(score);
    }

    results.appendChild(article);
  });
}

function renderImages() {
  results.innerHTML = "";

  const images = collectImages();

  if (!images.length) {
    results.innerHTML = `
      <div class="empty">
        No images found.
      </div>
    `;

    return;
  }

  const grid = document.createElement("div");
  grid.className = "image-grid";

  images.forEach(function (item) {
    const card = document.createElement("article");
    card.className = "image-card";

    const image = document.createElement("img");
    image.src = item.url;
    image.alt =
      item.alt ||
      item.title ||
      item.sourceTitle ||
      "SEErch² image";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";

    image.addEventListener("error", function () {
      card.remove();
    });

    const info = document.createElement("div");
    info.className = "image-info";

    const title = document.createElement("div");
    title.className = "image-title";
    title.textContent =
      item.alt ||
      item.title ||
      item.sourceTitle ||
      "Image";

    info.appendChild(title);

    if (item.sourceTitle || item.sourceUrl) {
      const source = document.createElement("div");
      source.className = "image-source";
      source.textContent =
        item.sourceTitle ||
        displayUrl(item.sourceUrl);

      info.appendChild(source);
    }

    card.appendChild(image);
    card.appendChild(info);

    card.addEventListener("click", function () {
      openUrl(item.url);
    });

    grid.appendChild(card);
  });

  results.appendChild(grid);
}

function renderVideos() {
  results.innerHTML = "";

  const videos = collectVideos();

  if (!videos.length) {
    results.innerHTML = `
      <div class="empty">
        No videos found.
      </div>
    `;

    return;
  }

  const grid = document.createElement("div");
  grid.className = "video-grid";

  videos.forEach(function (item) {
    const card = document.createElement("a");

    card.className = "video-card";
    card.href = safeUrl(item.url);
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const thumbnail = document.createElement("div");
    thumbnail.className = "video-thumbnail";

    if (item.thumbnail) {
      const image = document.createElement("img");

      image.src = item.thumbnail;
      image.alt =
        item.title ||
        "Video thumbnail";
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";

      image.addEventListener("error", function () {
        showVideoPlaceholder(thumbnail);
      });

      thumbnail.appendChild(image);
    } else {
      showVideoPlaceholder(thumbnail);
    }

    const info = document.createElement("div");
    info.className = "video-info";

    const title = document.createElement("div");
    title.className = "video-title";
    title.textContent =
      item.title ||
      item.sourceTitle ||
      "Video";

    info.appendChild(title);

    if (item.type) {
      const type = document.createElement("div");
      type.className = "video-type";
      type.textContent = item.type;
      info.appendChild(type);
    }

    card.appendChild(thumbnail);
    card.appendChild(info);

    grid.appendChild(card);
  });

  results.appendChild(grid);
}

function collectImages() {
  const output = [];

  currentResults.forEach(function (result) {
    if (!Array.isArray(result.images)) {
      return;
    }

    result.images.forEach(function (image) {
      if (
        !image ||
        typeof image !== "object" ||
        !image.url
      ) {
        return;
      }

      output.push({
        ...image,
        sourceUrl: result.url || "",
        sourceTitle: result.title || "",
        resultId: result.id
      });
    });
  });

  return output;
}

function collectVideos() {
  const output = [];

  currentResults.forEach(function (result) {
    if (!Array.isArray(result.videos)) {
      return;
    }

    result.videos.forEach(function (video) {
      if (
        !video ||
        typeof video !== "object" ||
        !video.url
      ) {
        return;
      }

      output.push({
        ...video,
        sourceUrl: result.url || "",
        sourceTitle: result.title || "",
        resultId: result.id
      });
    });
  });

  return output;
}

function safeUrl(url) {
  if (!url || typeof url !== "string") {
    return "#";
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return "#";
    }

    return parsed.href;
  } catch {
    return "#";
  }
}

function displayUrl(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  try {
    const parsed = new URL(url);

    return (
      parsed.hostname +
      (parsed.pathname !== "/" ? parsed.pathname : "")
    );
  } catch {
    return url;
  }
}

function openUrl(url) {
  const safe = safeUrl(url);

  if (safe === "#") {
    return;
  }

  window.open(
    safe,
    "_blank",
    "noopener,noreferrer"
  );
}

function formatScore(score) {
  if (!Number.isFinite(score)) {
    return "";
  }

  return Number(score).toFixed(2);
}

function showVideoPlaceholder(container) {
  container.innerHTML = `
    <div class="video-placeholder">
      <span>▶</span>
      <span>Video</span>
    </div>
  `;
}

function setLoading(value) {
  loading.style.display = value ? "block" : "none";
}

function loadInitialQuery() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");

  if (query) {
    searchInput.value = query;
    search(query);
  } else {
    renderResults();
  }
}

loadInitialQuery();
