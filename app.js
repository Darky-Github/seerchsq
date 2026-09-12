const API_URL = "https://seerchsqapi.darkyproton.workers.dev";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const tabs = document.querySelectorAll(".tab");
const results = document.getElementById("results");
const status = document.getElementById("status");
const loading = document.getElementById("loading");

let currentQuery = "";
let currentTab = "web";
let currentResults = [];

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

  setLoading(true);
  status.textContent = "";
  results.innerHTML = "";

  const url = `${API_URL}/search?q=${encodeURIComponent(query)}&page=1&limit=20`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    currentResults = Array.isArray(data.results)
      ? data.results
      : [];

    status.textContent = `${currentResults.length} results`;

    renderResults();

    history.replaceState(
      null,
      "",
      `?q=${encodeURIComponent(query)}`
    );
  } catch (error) {
    console.error(error);

    currentResults = [];
    status.textContent = "";

    results.innerHTML = `
      <div class="error">
        Search failed. Check that the SEErch² API is running and reachable.
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

  if (currentTab === "web") {
    renderWebResults();
    return;
  }

  if (currentTab === "images") {
    renderImages();
    return;
  }

  if (currentTab === "videos") {
    renderVideos();
    return;
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
    url.href = item.url || "#";
    url.target = "_blank";
    url.rel = "noopener noreferrer";
    url.textContent = item.url || "";

    const title = document.createElement("a");
    title.className = "result-title";
    title.href = item.url || "#";
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent = item.title || item.url || "Untitled";

    const description = document.createElement("div");
    description.className = "result-description";
    description.textContent =
      item.description || "No description available.";

    article.appendChild(url);
    article.appendChild(title);
    article.appendChild(description);

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
    image.alt = item.alt || item.title || "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";

    image.addEventListener("error", function () {
      card.style.display = "none";
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

    card.appendChild(image);
    card.appendChild(info);

    card.addEventListener("click", function () {
      window.open(item.url, "_blank", "noopener,noreferrer");
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
    card.href = item.url || "#";
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const thumbnail = document.createElement("div");
    thumbnail.className = "video-thumbnail";

    if (item.thumbnail) {
      const image = document.createElement("img");

      image.src = item.thumbnail;
      image.alt = item.title || "Video thumbnail";
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";

      image.addEventListener("error", function () {
        thumbnail.innerHTML = `
          <div class="video-placeholder">
            Video
          </div>
        `;
      });

      thumbnail.appendChild(image);
    } else {
      thumbnail.innerHTML = `
        <div class="video-placeholder">
          Video
        </div>
      `;
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
      if (!image || !image.url) {
        return;
      }

      output.push({
        ...image,
        sourceUrl: result.url,
        sourceTitle: result.title,
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
      if (!video || !video.url) {
        return;
      }

      output.push({
        ...video,
        sourceUrl: result.url,
        sourceTitle: result.title,
        resultId: result.id
      });
    });
  });

  return output;
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
