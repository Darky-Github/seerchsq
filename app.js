const API_URL = "https://seerchsqapi.darkyproton.workers.dev";

const OPEN_METEO_GEOCODING =
    "https://geocoding-api.open-meteo.com/v1/search";

const OPEN_METEO_FORECAST =
    "https://api.open-meteo.com/v1/forecast";

const ALPHA_VANTAGE_API =
    "https://www.alphavantage.co/query";

const DEFAULT_SETTINGS = {
    theme: "system",
    font: "system",
    accent: "#2563eb",
    customTheme: {
        background: "#ffffff",
        surface: "#f7f7f7",
        text: "#111111",
        muted: "#666666"
    },
    resultMode: "infinite",
    historyEnabled: false,
    safeSearch: "normal",
    mode: "default",
    weatherLocation: null,
    stockProvider: "alphavantage",
    stockApiKey: "",
    stockSymbols: [],
    customModes: [],
    layout: {
        widgets: []
    }
};

let settings = loadSettings();

const state = {
    query: "",
    tab: "web",
    results: [],
    mediaResults: {
        images: [],
        videos: []
    },
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    searchToken: 0,
    customization: false,
    draggedElement: null,
    imageItems: [],
    videoItems: []
};

const elements = {};

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    cacheElements();
    loadCustomFont();
    populateCustomModes();
    applySettings();
    populateSettingsUI();
    applySavedLayout();
    bindEvents();
    initializeHome();
}

function cacheElements() {
    elements.homePage = document.getElementById("homePage");
    elements.resultsPage = document.getElementById("resultsPage");

    elements.homeSearchForm = document.getElementById("homeSearchForm");
    elements.homeSearchInput = document.getElementById("homeSearchInput");

    elements.topSearchWrap = document.getElementById("topSearchWrap");
    elements.topSearchForm = document.getElementById("topSearchForm");
    elements.topSearchInput = document.getElementById("topSearchInput");

    elements.brand = document.getElementById("brand");

    elements.settingsButton = document.getElementById("settingsButton");
    elements.closeSettingsButton = document.getElementById("closeSettingsButton");
    elements.settingsPanel = document.getElementById("settingsPanel");
    elements.settingsBackdrop = document.getElementById("settingsBackdrop");

    elements.resultsContainer = document.getElementById("resultsContainer");
    elements.resultsMeta = document.getElementById("resultsMeta");
    elements.resultsStatus = document.getElementById("resultsStatus");

    elements.loadMoreArea = document.getElementById("loadMoreArea");
    elements.loadMoreButton = document.getElementById("loadMoreButton");

    elements.pageNavigation = document.getElementById("pageNavigation");
    elements.previousPageButton = document.getElementById("previousPageButton");
    elements.nextPageButton = document.getElementById("nextPageButton");
    elements.pageNumber = document.getElementById("pageNumber");

    elements.themeSelect = document.getElementById("themeSelect");
    elements.fontSelect = document.getElementById("fontSelect");
    elements.accentColorInput = document.getElementById("accentColorInput");

    elements.customThemeButton =
        document.getElementById("customThemeButton");

    elements.fontImportButton =
        document.getElementById("fontImportButton");

    elements.fontFileInput =
        document.getElementById("fontFileInput");

    elements.resultModeSelect =
        document.getElementById("resultModeSelect");

    elements.historyEnabledInput =
        document.getElementById("historyEnabledInput");

    elements.clearHistoryButton =
        document.getElementById("clearHistoryButton");

    elements.safeSearchSelect =
        document.getElementById("safeSearchSelect");

    elements.truthWarning =
        document.getElementById("truthWarning");

    elements.weatherSettingsAction =
        document.getElementById("weatherSettingsAction");

    elements.weatherUseLocationButton =
        document.getElementById("weatherUseLocationButton");

    elements.weatherRemoveButton =
        document.getElementById("weatherRemoveButton");

    elements.stockProviderSelect =
        document.getElementById("stockProviderSelect");

    elements.stockApiKeyInput =
        document.getElementById("stockApiKeyInput");

    elements.stockSymbolsInput =
        document.getElementById("stockSymbolsInput");

    elements.saveStocksButton =
        document.getElementById("saveStocksButton");

    elements.refreshStocksButton =
        document.getElementById("refreshStocksButton");

    elements.modeSelect =
        document.getElementById("modeSelect");

    elements.createModeButton =
        document.getElementById("createModeButton");

    elements.customizeUiButton =
        document.getElementById("customizeUiButton");

    elements.saveLayoutButton =
        document.getElementById("saveLayoutButton");

    elements.cancelLayoutButton =
        document.getElementById("cancelLayoutButton");

    elements.exportSettingsButton =
        document.getElementById("exportSettingsButton");

    elements.importSettingsButton =
        document.getElementById("importSettingsButton");

    elements.settingsFileInput =
        document.getElementById("settingsFileInput");

    elements.resetSettingsButton =
        document.getElementById("resetSettingsButton");

    elements.weatherLocationName =
        document.getElementById("weatherLocationName");

    elements.weatherContent =
        document.getElementById("weatherContent");

    elements.weatherAddButton =
        document.getElementById("weatherAddButton");

    elements.weatherSettingsButton =
        document.getElementById("weatherSettingsButton");

    elements.stocksContent =
        document.getElementById("stocksContent");

    elements.stockSettingsButton =
        document.getElementById("stockSettingsButton");

    elements.stockAddButton =
        document.getElementById("stockAddButton");

    elements.customThemeModal =
        document.getElementById("customThemeModal");

    elements.customBackgroundInput =
        document.getElementById("customBackgroundInput");

    elements.customSurfaceInput =
        document.getElementById("customSurfaceInput");

    elements.customTextInput =
        document.getElementById("customTextInput");

    elements.customMutedInput =
        document.getElementById("customMutedInput");

    elements.saveCustomThemeButton =
        document.getElementById("saveCustomThemeButton");

    elements.locationModal =
        document.getElementById("locationModal");

    elements.locationSearchForm =
        document.getElementById("locationSearchForm");

    elements.locationSearchInput =
        document.getElementById("locationSearchInput");

    elements.locationResults =
        document.getElementById("locationResults");

    elements.modalUseLocationButton =
        document.getElementById("modalUseLocationButton");

    elements.modeModal =
        document.getElementById("modeModal");

    elements.modeNameInput =
        document.getElementById("modeNameInput");

    elements.modeKeywordsInput =
        document.getElementById("modeKeywordsInput");

    elements.modeDomainsInput =
        document.getElementById("modeDomainsInput");

    elements.modeFreshnessInput =
        document.getElementById("modeFreshnessInput");

    elements.modeTechnicalInput =
        document.getElementById("modeTechnicalInput");

    elements.saveModeButton =
        document.getElementById("saveModeButton");

    elements.imageViewer =
        document.getElementById("imageViewer");

    elements.viewerImage =
        document.getElementById("viewerImage");

    elements.viewerImageTitle =
        document.getElementById("viewerImageTitle");

    elements.viewerImageSource =
        document.getElementById("viewerImageSource");

    elements.viewerImageDownload =
        document.getElementById("viewerImageDownload");

    elements.viewerImageUrl =
        document.getElementById("viewerImageUrl");

    elements.viewerImagePage =
        document.getElementById("viewerImagePage");

    elements.closeImageViewer =
        document.getElementById("closeImageViewer");

    elements.toast =
        document.getElementById("toast");
}

function bindEvents() {
    elements.homeSearchForm.addEventListener("submit", event => {
        event.preventDefault();
        runSearch(elements.homeSearchInput.value);
    });

    elements.topSearchForm.addEventListener("submit", event => {
        event.preventDefault();
        runSearch(elements.topSearchInput.value);
    });

    elements.brand.addEventListener("click", goHome);

    elements.settingsButton.addEventListener("click", openSettings);
    elements.closeSettingsButton.addEventListener("click", closeSettings);
    elements.settingsBackdrop.addEventListener("click", closeSettings);

    document.querySelectorAll(".result-tab").forEach(button => {
        button.addEventListener("click", () => {
            switchTab(button.dataset.tab);
        });
    });

    elements.loadMoreButton.addEventListener("click", () => {
        if (state.loading || !state.hasMore) {
            return;
        }

        state.page += 1;
        fetchResults(false);
    });

    elements.previousPageButton.addEventListener("click", () => {
        if (state.page <= 1 || state.loading) {
            return;
        }

        state.page -= 1;
        fetchResults(true);
    });

    elements.nextPageButton.addEventListener("click", () => {
        if (!state.hasMore || state.loading) {
            return;
        }

        state.page += 1;
        fetchResults(true);
    });

    elements.themeSelect.addEventListener("change", event => {
        settings.theme = event.target.value;
        saveSettings();
        applySettings();
    });

    elements.fontSelect.addEventListener("change", event => {
        settings.font = event.target.value;
        saveSettings();
        applySettings();
    });

    elements.accentColorInput.addEventListener("input", event => {
        settings.accent = event.target.value;
        saveSettings();
        applySettings();
    });

    elements.customThemeButton.addEventListener(
        "click",
        openCustomThemeModal
    );

    elements.fontImportButton.addEventListener(
        "click",
        () => elements.fontFileInput.click()
    );

    elements.fontFileInput.addEventListener(
        "change",
        handleFontImport
    );

    elements.resultModeSelect.addEventListener("change", event => {
        settings.resultMode = event.target.value;
        saveSettings();
        updatePaginationUI();
    });

    elements.historyEnabledInput.addEventListener("change", event => {
        settings.historyEnabled = event.target.checked;
        saveSettings();
    });

    elements.clearHistoryButton.addEventListener("click", () => {
        localStorage.removeItem("seerch_history");
        showToast("Local search history cleared");
    });

    elements.safeSearchSelect.addEventListener("change", event => {
        settings.safeSearch = event.target.value;
        saveSettings();
        updateTruthWarning();

        if (state.query) {
            state.results = applySafeSearch(state.results);
            state.mediaResults = buildMediaResults(state.results);
            renderCurrentResults();
        }
    });

    elements.weatherAddButton.addEventListener(
        "click",
        openLocationModal
    );

    elements.weatherSettingsButton.addEventListener(
        "click",
        openLocationModal
    );

    elements.weatherSettingsAction.addEventListener(
        "click",
        openLocationModal
    );

    elements.weatherUseLocationButton.addEventListener(
        "click",
        useBrowserLocation
    );

    elements.modalUseLocationButton.addEventListener(
        "click",
        useBrowserLocation
    );

    elements.weatherRemoveButton.addEventListener("click", () => {
        settings.weatherLocation = null;
        saveSettings();
        renderWeatherEmpty();
        showToast("Weather location removed");
    });

    elements.locationSearchForm.addEventListener("submit", event => {
        event.preventDefault();
        searchLocations(elements.locationSearchInput.value);
    });

    elements.stockSettingsButton.addEventListener(
        "click",
        openSettings
    );

    elements.stockAddButton.addEventListener(
        "click",
        openSettings
    );

    elements.saveStocksButton.addEventListener(
        "click",
        saveStockSettings
    );

    elements.refreshStocksButton.addEventListener(
        "click",
        () => loadStocks(true)
    );

    elements.modeSelect.addEventListener("change", event => {
        settings.mode = event.target.value;
        saveSettings();

        if (state.query) {
            renderCurrentResults();
        }
    });

    elements.createModeButton.addEventListener(
        "click",
        openModeModal
    );

    elements.saveModeButton.addEventListener(
        "click",
        saveCustomMode
    );

    elements.customizeUiButton.addEventListener(
        "click",
        startCustomization
    );

    elements.saveLayoutButton.addEventListener(
        "click",
        saveLayout
    );

    elements.cancelLayoutButton.addEventListener(
        "click",
        cancelCustomization
    );

    elements.exportSettingsButton.addEventListener(
        "click",
        exportSettings
    );

    elements.importSettingsButton.addEventListener(
        "click",
        () => elements.settingsFileInput.click()
    );

    elements.settingsFileInput.addEventListener(
        "change",
        importSettings
    );

    elements.resetSettingsButton.addEventListener(
        "click",
        resetSettings
    );

    elements.saveCustomThemeButton.addEventListener(
        "click",
        saveCustomTheme
    );

    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.dataset.closeModal);
        });
    });

    elements.closeImageViewer.addEventListener(
        "click",
        closeImageViewer
    );

    document
        .querySelector(".image-viewer-backdrop")
        .addEventListener("click", closeImageViewer);

    document.addEventListener("keydown", handleKeyboard);

    window.addEventListener("scroll", handleInfiniteScroll);

    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
            if (settings.theme === "system") {
                applySettings();
            }
        });
}

function initializeHome() {
    elements.topSearchWrap.classList.add("hidden");

    if (settings.weatherLocation) {
        loadWeather();
    } else {
        renderWeatherEmpty();
    }

    if (settings.stockSymbols.length) {
        loadStocks();
    } else {
        renderStocksEmpty();
    }
}

async function runSearch(query) {
    query = String(query || "").trim();

    if (!query) {
        return;
    }

    closeSettings();

    state.query = query;
    state.page = 1;
    state.results = [];
    state.mediaResults = {
        images: [],
        videos: []
    };
    state.hasMore = true;

    elements.homePage.classList.add("hidden");
    elements.resultsPage.classList.remove("hidden");
    elements.topSearchWrap.classList.remove("hidden");

    elements.homeSearchInput.value = query;
    elements.topSearchInput.value = query;

    if (settings.historyEnabled) {
        saveHistory(query);
    }

    switchTab("web");

    await fetchResults(true);
}

async function fetchResults(replace) {
    if (state.loading || !state.query) {
        return;
    }

    state.loading = true;

    const token = ++state.searchToken;

    elements.resultsStatus.textContent =
        replace ? "Searching..." : "Loading...";

    if (replace) {
        elements.resultsContainer.innerHTML = "";
    }

    try {
        const params = new URLSearchParams({
            q: state.query,
            page: String(state.page),
            limit: String(state.pageSize)
        });

        const response = await fetch(
            `${API_URL}/search?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(
                `Search request failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (token !== state.searchToken) {
            return;
        }

        let incoming = Array.isArray(data.results)
            ? data.results
            : [];

        incoming = applySafeSearch(incoming);

        if (replace) {
            state.results = incoming;
        } else {
            state.results = [
                ...state.results,
                ...incoming
            ];
        }

        state.hasMore =
            incoming.length >= state.pageSize;

        state.mediaResults =
            buildMediaResults(state.results);

        renderCurrentResults();
        updatePaginationUI();

        elements.resultsStatus.textContent =
            incoming.length
                ? ""
                : "No results found.";
    } catch (error) {
        elements.resultsStatus.textContent =
            error.message || "Search failed.";
    } finally {
        state.loading = false;
    }
}

function applySafeSearch(results) {
    if (settings.safeSearch === "truth") {
        return results;
    }

    const blocked =
        settings.safeSearch === "extreme"
            ? [
                "porn",
                "xxx",
                "sexual",
                "violence",
                "gore",
                "drug",
                "casino",
                "gambling"
            ]
            : settings.safeSearch === "normal"
                ? [
                    "porn",
                    "xxx",
                    "sexual",
                    "gore",
                    "casino",
                    "gambling"
                ]
                : [
                    "malware",
                    "phishing",
                    "exploit"
                ];

    return results.filter(result => {
        const text = [
            result.title,
            result.description,
            result.url
        ]
            .join(" ")
            .toLowerCase();

        return !blocked.some(
            word => text.includes(word)
        );
    });
}

function buildMediaResults(results) {
    const images = [];
    const videos = [];

    for (const result of results) {
        if (Array.isArray(result.images)) {
            for (const image of result.images) {
                if (!image || !image.url) {
                    continue;
                }

                images.push({
                    ...image,
                    pageUrl: result.url,
                    pageTitle: result.title || ""
                });
            }
        }

        if (Array.isArray(result.videos)) {
            for (const video of result.videos) {
                if (!video || !video.url) {
                    continue;
                }

                videos.push({
                    ...video,
                    pageUrl: result.url,
                    pageTitle: result.title || ""
                });
            }
        }
    }

    return {
        images,
        videos
    };
}

function switchTab(tab) {
    state.tab = tab;

    document
        .querySelectorAll(".result-tab")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.tab === tab
            );
        });

    renderCurrentResults();
}

function renderCurrentResults() {
    if (state.tab === "web") {
        renderWebResults();
        return;
    }

    if (state.tab === "images") {
        renderImageResults();
        return;
    }

    if (state.tab === "videos") {
        renderVideoResults();
        return;
    }

    renderNewsResults();
}

function renderWebResults() {
    elements.resultsContainer.innerHTML = "";

    const results =
        rankResultsForMode(state.results);

    elements.resultsMeta.textContent =
        `${results.length} results`;

    if (!results.length) {
        elements.resultsStatus.textContent =
            "No web results.";

        return;
    }

    for (const result of results) {
        const article =
            document.createElement("article");

        article.className = "web-result";

        const url =
            document.createElement("div");

        url.className = "result-url";
        url.textContent = result.url || "";

        const title =
            document.createElement("a");

        title.className = "result-title";
        title.href = result.url || "#";
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.textContent =
            result.title ||
            result.url ||
            "Untitled";

        const description =
            document.createElement("p");

        description.className =
            "result-description";

        description.textContent =
            result.description || "";

        const score =
            document.createElement("div");

        score.className = "result-score";

        score.textContent =
            Number.isFinite(result.score)
                ? `Truth25 score: ${Number(
                    result.score
                ).toFixed(2)}`
                : "";

        article.appendChild(url);
        article.appendChild(title);
        article.appendChild(description);
        article.appendChild(score);

        elements.resultsContainer.appendChild(
            article
        );
    }

    elements.resultsStatus.textContent = "";
}

function renderImageResults() {
    elements.resultsContainer.innerHTML = "";

    const images =
        state.mediaResults.images || [];

    elements.resultsMeta.textContent =
        `${images.length} images`;

    if (!images.length) {
        elements.resultsStatus.textContent =
            "No images found.";

        return;
    }

    const grid =
        document.createElement("div");

    grid.className = "media-grid";

    state.imageItems = images;

    images.forEach((image, index) => {
        const card =
            document.createElement("article");

        card.className = "media-card";

        const img =
            document.createElement("img");

        img.className = "media-image";
        img.src = image.url;
        img.alt =
            image.title ||
            image.pageTitle ||
            "Image";
        img.loading = "lazy";

        const body =
            document.createElement("div");

        body.className =
            "media-card-body";

        const title =
            document.createElement("div");

        title.className =
            "media-card-title";

        title.textContent =
            image.title ||
            image.pageTitle ||
            "Image";

        const source =
            document.createElement("div");

        source.className =
            "media-card-source";

        source.textContent =
            image.pageUrl || "";

        body.appendChild(title);
        body.appendChild(source);

        card.appendChild(img);
        card.appendChild(body);

        card.addEventListener(
            "click",
            () => openImageViewer(index)
        );

        grid.appendChild(card);
    });

    elements.resultsContainer.appendChild(grid);
    elements.resultsStatus.textContent = "";
}

function renderVideoResults() {
    elements.resultsContainer.innerHTML = "";

    const videos =
        state.mediaResults.videos || [];

    elements.resultsMeta.textContent =
        `${videos.length} videos`;

    if (!videos.length) {
        elements.resultsStatus.textContent =
            "No videos found.";

        return;
    }

    const grid =
        document.createElement("div");

    grid.className = "media-grid";

    state.videoItems = videos;

    videos.forEach(video => {
        const card =
            document.createElement("article");

        card.className =
            "media-card video-card";

        const image =
            document.createElement("img");

        image.className =
            "media-image";

        image.src =
            video.thumbnail || "";

        image.alt =
            video.title ||
            video.pageTitle ||
            "Video";

        image.loading = "lazy";

        const play =
            document.createElement("div");

        play.className =
            "video-play";

        play.textContent = "▶";

        const body =
            document.createElement("div");

        body.className =
            "media-card-body";

        const title =
            document.createElement("div");

        title.className =
            "media-card-title";

        title.textContent =
            video.title ||
            video.pageTitle ||
            "Video";

        const source =
            document.createElement("div");

        source.className =
            "media-card-source";

        source.textContent =
            video.pageUrl || "";

        body.appendChild(title);
        body.appendChild(source);

        card.appendChild(image);
        card.appendChild(play);
        card.appendChild(body);

        card.addEventListener("click", () => {
            window.open(
                video.url,
                "_blank",
                "noopener,noreferrer"
            );
        });

        grid.appendChild(card);
    });

    elements.resultsContainer.appendChild(grid);
    elements.resultsStatus.textContent = "";
}

function renderNewsResults() {
    elements.resultsContainer.innerHTML = "";

    const results =
        rankResultsForMode(state.results)
            .filter(result => {
                const text = [
                    result.title,
                    result.description,
                    result.url
                ]
                    .join(" ")
                    .toLowerCase();

                return [
                    "news",
                    "latest",
                    "report",
                    "press",
                    "breaking"
                ].some(word =>
                    text.includes(word)
                );
            });

    elements.resultsMeta.textContent =
        `${results.length} news-style results`;

    if (!results.length) {
        elements.resultsStatus.textContent =
            "No news results found in the current search results.";

        return;
    }

    for (const result of results) {
        const article =
            document.createElement("article");

        article.className = "web-result";

        const title =
            document.createElement("a");

        title.className = "result-title";
        title.href = result.url || "#";
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.textContent =
            result.title ||
            result.url ||
            "Untitled";

        const description =
            document.createElement("p");

        description.className =
            "result-description";

        description.textContent =
            result.description || "";

        const url =
            document.createElement("div");

        url.className = "result-url";
        url.textContent =
            result.url || "";

        article.appendChild(title);
        article.appendChild(description);
        article.appendChild(url);

        elements.resultsContainer.appendChild(
            article
        );
    }

    elements.resultsStatus.textContent = "";
}

function rankResultsForMode(results) {
    const mode = getActiveMode();

    if (!mode || mode.name === "default") {
        return [...results];
    }

    const keywords =
        mode.keywords || [];

    const domains =
        mode.domains || [];

    const freshness =
        Number(mode.freshness || 0);

    const technical =
        Number(mode.technical || 0);

    return [...results]
        .map(result => {
            let bonus = 0;

            const text = [
                result.title,
                result.description,
                result.url
            ]
                .join(" ")
                .toLowerCase();

            for (const keyword of keywords) {
                if (
                    text.includes(
                        keyword.toLowerCase()
                    )
                ) {
                    bonus += 3;
                }
            }

            for (const domain of domains) {
                if (
                    String(result.url || "")
                        .includes(domain)
                ) {
                    bonus += 8;
                }
            }

            if (technical > 0) {
                const technicalWords = [
                    "api",
                    "github",
                    "documentation",
                    "developer",
                    "programming",
                    "software",
                    "code",
                    "research"
                ];

                const matches =
                    technicalWords.filter(
                        word => text.includes(word)
                    ).length;

                bonus +=
                    matches *
                    (technical / 5);
            }

            if (
                freshness > 0 &&
                result.date
            ) {
                const date =
                    new Date(result.date);

                if (!Number.isNaN(
                    date.getTime()
                )) {
                    const age =
                        Math.floor(
                            (
                                Date.now() -
                                date.getTime()
                            ) / 86400000
                        );

                    if (age <= freshness) {
                        bonus += 5;
                    }
                }
            }

            return {
                ...result,
                modeScore:
                    Number(result.score || 0) +
                    bonus
            };
        })
        .sort(
            (a, b) =>
                b.modeScore -
                a.modeScore
        );
}

function getActiveMode() {
    if (settings.mode === "default") {
        return {
            name: "default",
            keywords: [],
            domains: [],
            freshness: 0,
            technical: 0
        };
    }

    const builtIn = {
        technology: {
            name: "technology",
            keywords: [
                "technology",
                "software",
                "programming",
                "developer",
                "computer",
                "hardware"
            ],
            domains: [],
            freshness: 0,
            technical: 7
        },

        ai: {
            name: "ai",
            keywords: [
                "artificial intelligence",
                "ai",
                "machine learning",
                "llm",
                "neural network"
            ],
            domains: [],
            freshness: 7,
            technical: 7
        },

        news: {
            name: "news",
            keywords: [
                "news",
                "latest",
                "breaking",
                "report"
            ],
            domains: [],
            freshness: 3,
            technical: 0
        },

        academic: {
            name: "academic",
            keywords: [
                "research",
                "study",
                "paper",
                "journal",
                "university",
                "science"
            ],
            domains: [
                ".edu",
                "arxiv.org",
                "nature.com",
                "sciencedirect.com"
            ],
            freshness: 30,
            technical: 5
        }
    };

    return (
        builtIn[settings.mode] ||
        settings.customModes.find(
            mode => mode.id === settings.mode
        ) ||
        builtIn.technology
    );
}

function updatePaginationUI() {
    elements.loadMoreArea.classList.toggle(
        "hidden",
        settings.resultMode !== "loadmore" ||
        !state.hasMore
    );

    elements.pageNavigation.classList.toggle(
        "hidden",
        settings.resultMode !== "pages"
    );

    if (settings.resultMode === "pages") {
        elements.previousPageButton.disabled =
            state.page <= 1;

        elements.nextPageButton.disabled =
            !state.hasMore;

        elements.pageNumber.textContent =
            String(state.page);
    }
}

function handleInfiniteScroll() {
    if (
        settings.resultMode !== "infinite" ||
        state.loading ||
        !state.hasMore ||
        !state.query
    ) {
        return;
    }

    const nearBottom =
        window.innerHeight +
        window.scrollY >=
        document.documentElement.scrollHeight -
        700;

    if (nearBottom) {
        state.page += 1;
        fetchResults(false);
    }
}

function openSettings() {
    elements.settingsPanel.classList.add("open");
    elements.settingsBackdrop.classList.add("open");
}

function closeSettings() {
    elements.settingsPanel.classList.remove("open");
    elements.settingsBackdrop.classList.remove("open");
}

function openModal(element) {
    element.classList.remove("hidden");
}

function closeModal(id) {
    const element =
        document.getElementById(id);

    if (element) {
        element.classList.add("hidden");
    }
}

function openCustomThemeModal() {
    elements.customBackgroundInput.value =
        settings.customTheme.background;

    elements.customSurfaceInput.value =
        settings.customTheme.surface;

    elements.customTextInput.value =
        settings.customTheme.text;

    elements.customMutedInput.value =
        settings.customTheme.muted;

    openModal(elements.customThemeModal);
}

function saveCustomTheme() {
    settings.customTheme = {
        background:
            elements.customBackgroundInput.value,

        surface:
            elements.customSurfaceInput.value,

        text:
            elements.customTextInput.value,

        muted:
            elements.customMutedInput.value
    };

    settings.theme = "custom";

    saveSettings();
    applySettings();
    populateSettingsUI();

    closeModal("customThemeModal");

    showToast("Custom theme saved");
}

async function handleFontImport(event) {
    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const buffer =
            await file.arrayBuffer();

        const base64 =
            arrayBufferToBase64(buffer);

        const fontData = {
            name:
                `SEErchCustomFont_${Date.now()}`,

            mime:
                file.type ||
                guessFontMime(file.name),

            data: base64
        };

        localStorage.setItem(
            "seerch_custom_font",
            JSON.stringify(fontData)
        );

        installCustomFont(fontData);

        settings.font = "custom";

        saveSettings();
        applySettings();

        showToast("Font imported");
    } catch {
        showToast("Could not import font");
    }

    event.target.value = "";
}

function guessFontMime(name) {
    const lower =
        name.toLowerCase();

    if (lower.endsWith(".woff2")) {
        return "font/woff2";
    }

    if (lower.endsWith(".woff")) {
        return "font/woff";
    }

    if (lower.endsWith(".otf")) {
        return "font/otf";
    }

    if (lower.endsWith(".ttf")) {
        return "font/ttf";
    }

    return "font/woff2";
}

function installCustomFont(fontData) {
    const previous =
        document.getElementById(
            "seerch-custom-font-style"
        );

    if (previous) {
        previous.remove();
    }

    const style =
        document.createElement("style");

    style.id =
        "seerch-custom-font-style";

    style.textContent = `
        @font-face {
            font-family: "${fontData.name}";
            src: url("data:${fontData.mime};base64,${fontData.data}");
            font-display: swap;
        }
    `;

    document.head.appendChild(style);
}

function loadCustomFont() {
    const raw =
        localStorage.getItem(
            "seerch_custom_font"
        );

    if (!raw) {
        return;
    }

    try {
        const fontData =
            JSON.parse(raw);

        installCustomFont(fontData);
    } catch {
        localStorage.removeItem(
            "seerch_custom_font"
        );
    }
}

function applySettings() {
    const root =
        document.documentElement;

    root.style.setProperty(
        "--accent",
        settings.accent
    );

    const theme =
        resolveTheme(settings.theme);

    if (theme === "dark") {
        setThemeColors({
            bg: "#111111",
            surface: "#1b1b1b",
            surface2: "#242424",
            text: "#f5f5f5",
            muted: "#a0a0a0",
            border: "#333333"
        });
    } else if (theme === "paper") {
        setThemeColors({
            bg: "#f4efe4",
            surface: "#eee7d8",
            surface2: "#e5ddcb",
            text: "#28251f",
            muted: "#6d675d",
            border: "#d4ccbc"
        });
    } else if (theme === "amoled") {
        setThemeColors({
            bg: "#000000",
            surface: "#090909",
            surface2: "#121212",
            text: "#ffffff",
            muted: "#999999",
            border: "#242424"
        });
    } else if (theme === "custom") {
        setThemeColors({
            bg: settings.customTheme.background,
            surface: settings.customTheme.surface,
            surface2: adjustColor(
                settings.customTheme.surface,
                -8
            ),
            text: settings.customTheme.text,
            muted: settings.customTheme.muted,
            border: adjustColor(
                settings.customTheme.surface,
                -20
            )
        });
    } else {
        setThemeColors({
            bg: "#ffffff",
            surface: "#f7f7f8",
            surface2: "#eeeeef",
            text: "#111111",
            muted: "#666666",
            border: "#dedede"
        });
    }

    root.style.setProperty(
        "--font",
        getFontFamily(settings.font)
    );

    updateTruthWarning();
}

function setThemeColors(colors) {
    const root =
        document.documentElement;

    root.style.setProperty(
        "--bg",
        colors.bg
    );

    root.style.setProperty(
        "--surface",
        colors.surface
    );

    root.style.setProperty(
        "--surface-2",
        colors.surface2
    );

    root.style.setProperty(
        "--text",
        colors.text
    );

    root.style.setProperty(
        "--muted",
        colors.muted
    );

    root.style.setProperty(
        "--border",
        colors.border
    );
}

function resolveTheme(theme) {
    if (theme !== "system") {
        return theme;
    }

    return window
        .matchMedia(
            "(prefers-color-scheme: dark)"
        )
        .matches
        ? "dark"
        : "light";
}

function getFontFamily(font) {
    if (font === "inter") {
        return "Inter, system-ui, sans-serif";
    }

    if (font === "arial") {
        return "Arial, sans-serif";
    }

    if (font === "verdana") {
        return "Verdana, sans-serif";
    }

    if (font === "georgia") {
        return "Georgia, serif";
    }

    if (font === "monospace") {
        return "ui-monospace, SFMono-Regular, Menlo, monospace";
    }

    if (font === "custom") {
        const raw =
            localStorage.getItem(
                "seerch_custom_font"
            );

        if (raw) {
            try {
                const data =
                    JSON.parse(raw);

                return `"${data.name}", system-ui, sans-serif`;
            } catch {
                return "system-ui, sans-serif";
            }
        }
    }

    return "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
}

function populateSettingsUI() {
    elements.themeSelect.value =
        settings.theme;

    elements.fontSelect.value =
        settings.font;

    elements.accentColorInput.value =
        settings.accent;

    elements.resultModeSelect.value =
        settings.resultMode;

    elements.historyEnabledInput.checked =
        settings.historyEnabled;

    elements.safeSearchSelect.value =
        settings.safeSearch;

    elements.modeSelect.value =
        settings.mode;

    elements.stockProviderSelect.value =
        settings.stockProvider;

    elements.stockApiKeyInput.value =
        settings.stockApiKey;

    elements.stockSymbolsInput.value =
        settings.stockSymbols.join(", ");

    updateTruthWarning();
}

function updateTruthWarning() {
    elements.truthWarning.classList.toggle(
        "hidden",
        settings.safeSearch !== "truth"
    );
}

function openLocationModal() {
    elements.locationSearchInput.value =
        settings.weatherLocation?.name || "";

    elements.locationResults.innerHTML = "";

    openModal(elements.locationModal);

    setTimeout(
        () =>
            elements.locationSearchInput.focus(),
        50
    );
}

async function searchLocations(query) {
    query =
        String(query || "").trim();

    if (!query) {
        return;
    }

    elements.locationResults.innerHTML =
        "<div class=\"settings-description\">Searching...</div>";

    try {
        const params =
            new URLSearchParams({
                name: query,
                count: "8",
                language: "en",
                format: "json"
            });

        const response =
            await fetch(
                `${OPEN_METEO_GEOCODING}?${params.toString()}`
            );

        if (!response.ok) {
            throw new Error(
                "Location search failed"
            );
        }

        const data =
            await response.json();

        const locations =
            Array.isArray(data.results)
                ? data.results
                : [];

        elements.locationResults.innerHTML =
            "";

        if (!locations.length) {
            elements.locationResults.innerHTML =
                "<div class=\"settings-description\">No locations found.</div>";

            return;
        }

        locations.forEach(location => {
            const button =
                document.createElement("button");

            button.className =
                "location-result";

            const title =
                document.createElement("strong");

            title.textContent =
                location.name || "";

            const details =
                document.createElement("span");

            details.textContent = [
                location.admin1,
                location.country
            ]
                .filter(Boolean)
                .join(", ");

            button.appendChild(title);
            button.appendChild(details);

            button.addEventListener(
                "click",
                () =>
                    selectWeatherLocation(
                        location
                    )
            );

            elements.locationResults.appendChild(
                button
            );
        });
    } catch {
        elements.locationResults.innerHTML =
            "<div class=\"settings-description\">Could not search for that location.</div>";
    }
}

function selectWeatherLocation(location) {
    settings.weatherLocation = {
        name: location.name,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        country: location.country || "",
        admin1: location.admin1 || ""
    };

    saveSettings();

    closeModal("locationModal");

    loadWeather();
}

function useBrowserLocation() {
    if (!navigator.geolocation) {
        showToast(
            "Geolocation is not available in this browser"
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(
        async position => {
            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            try {
                const location =
                    await reverseGeocode(
                        latitude,
                        longitude
                    );

                settings.weatherLocation = {
                    name:
                        location?.name ||
                        "Current location",

                    latitude,
                    longitude,

                    country:
                        location?.country || "",

                    admin1:
                        location?.admin1 || ""
                };

                saveSettings();

                closeModal(
                    "locationModal"
                );

                loadWeather();
            } catch {
                settings.weatherLocation = {
                    name: "Current location",
                    latitude,
                    longitude,
                    country: "",
                    admin1: ""
                };

                saveSettings();

                closeModal(
                    "locationModal"
                );

                loadWeather();
            }
        },
        () => {
            showToast(
                "Location permission was not granted"
            );
        },
        {
            enableHighAccuracy: false,
            maximumAge: 300000,
            timeout: 10000
        }
    );
}

async function reverseGeocode(
    latitude,
    longitude
) {
    const params =
        new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            count: "1",
            language: "en",
            format: "json"
        });

    const response =
        await fetch(
            `${OPEN_METEO_GEOCODING}?${params.toString()}`
        );

    if (!response.ok) {
        throw new Error(
            "Reverse geocoding failed"
        );
    }

    const data =
        await response.json();

    return data.results?.[0] || null;
}

async function loadWeather() {
    if (!settings.weatherLocation) {
        renderWeatherEmpty();
        return;
    }

    const location =
        settings.weatherLocation;

    elements.weatherLocationName.textContent =
        location.name;

    elements.weatherContent.innerHTML =
        "<div class=\"settings-description\">Loading weather...</div>";

    try {
        const params =
            new URLSearchParams({
                latitude:
                    String(location.latitude),

                longitude:
                    String(location.longitude),

                current: [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m"
                ].join(","),

                timezone: "auto",

                forecast_days: "1"
            });

        const response =
            await fetch(
                `${OPEN_METEO_FORECAST}?${params.toString()}`
            );

        if (!response.ok) {
            throw new Error(
                "Weather request failed"
            );
        }

        const data =
            await response.json();

        renderWeather(data);
    } catch {
        elements.weatherContent.innerHTML = `
            <div class="widget-empty">
                <p>Weather could not be loaded.</p>
                <button class="primary-small-button" id="retryWeatherButton">
                    Retry
                </button>
            </div>
        `;

        document
            .getElementById(
                "retryWeatherButton"
            )
            .addEventListener(
                "click",
                loadWeather
            );
    }
}

function renderWeather(data) {
    const current =
        data.current;

    if (!current) {
        renderWeatherEmpty();
        return;
    }

    elements.weatherContent.innerHTML =
        "";

    const main =
        document.createElement("div");

    main.className =
        "weather-main";

    const temperature =
        document.createElement("div");

    temperature.className =
        "weather-temperature";

    temperature.textContent =
        `${Math.round(
            current.temperature_2m
        )}°`;

    const condition =
        document.createElement("div");

    condition.className =
        "weather-condition";

    condition.textContent =
        weatherCodeToText(
            current.weather_code
        );

    main.appendChild(temperature);
    main.appendChild(condition);

    const details =
        document.createElement("div");

    details.className =
        "weather-details";

    details.appendChild(
        createWeatherDetail(
            "Feels like",
            `${Math.round(
                current.apparent_temperature
            )}°`
        )
    );

    details.appendChild(
        createWeatherDetail(
            "Humidity",
            `${Math.round(
                current.relative_humidity_2m
            )}%`
        )
    );

    details.appendChild(
        createWeatherDetail(
            "Wind",
            `${Math.round(
                current.wind_speed_10m
            )} km/h`
        )
    );

    elements.weatherContent.appendChild(
        main
    );

    elements.weatherContent.appendChild(
        details
    );
}

function createWeatherDetail(
    label,
    value
) {
    const element =
        document.createElement("div");

    element.className =
        "weather-detail";

    const labelElement =
        document.createElement("span");

    labelElement.textContent =
        label;

    const valueElement =
        document.createElement("strong");

    valueElement.textContent =
        value;

    element.appendChild(
        labelElement
    );

    element.appendChild(
        valueElement
    );

    return element;
}

function renderWeatherEmpty() {
    elements.weatherLocationName.textContent =
        "Add your location";

    elements.weatherContent.innerHTML = `
        <div class="widget-empty">
            <span class="widget-icon">☁</span>
            <p>Add a location to see the current weather.</p>
            <button id="weatherAddButtonInner" class="primary-small-button">
                Add location
            </button>
        </div>
    `;

    document
        .getElementById(
            "weatherAddButtonInner"
        )
        .addEventListener(
            "click",
            openLocationModal
        );
}

function weatherCodeToText(code) {
    const map = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Drizzle",
        55: "Heavy drizzle",
        56: "Freezing drizzle",
        57: "Heavy freezing drizzle",
        61: "Light rain",
        63: "Rain",
        65: "Heavy rain",
        66: "Freezing rain",
        67: "Heavy freezing rain",
        71: "Light snow",
        73: "Snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Light showers",
        81: "Showers",
        82: "Heavy showers",
        85: "Snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"
    };

    return (
        map[code] ||
        "Unknown conditions"
    );
}

function saveStockSettings() {
    settings.stockProvider =
        elements.stockProviderSelect.value;

    settings.stockApiKey =
        elements.stockApiKeyInput.value.trim();

    settings.stockSymbols =
        elements.stockSymbolsInput.value
            .split(",")
            .map(value =>
                value.trim().toUpperCase()
            )
            .filter(Boolean)
            .slice(0, 20);

    saveSettings();

    loadStocks(true);

    showToast(
        "Stock settings saved"
    );
}

async function loadStocks() {
    if (!settings.stockSymbols.length) {
        renderStocksEmpty();
        return;
    }

    if (
        settings.stockProvider ===
        "alphavantage"
    ) {
        await loadAlphaVantageStocks();
        return;
    }

    renderStocksEmpty();
}

async function loadAlphaVantageStocks() {
    if (!settings.stockApiKey) {
        elements.stocksContent.innerHTML = `
            <div class="widget-empty">
                <p>Add your Alpha Vantage API key in Settings.</p>
            </div>
        `;

        return;
    }

    elements.stocksContent.innerHTML = `
        <div class="widget-empty">
            <p>Loading market data...</p>
        </div>
    `;

    const results = [];

    for (const symbol of settings.stockSymbols) {
        try {
            const params =
                new URLSearchParams({
                    function: "GLOBAL_QUOTE",
                    symbol,
                    apikey:
                        settings.stockApiKey
                });

            const response =
                await fetch(
                    `${ALPHA_VANTAGE_API}?${params.toString()}`
                );

            if (!response.ok) {
                throw new Error(
                    "Stock request failed"
                );
            }

            const data =
                await response.json();

            if (data["Error Message"]) {
                throw new Error(
                    data["Error Message"]
                );
            }

            if (data.Note) {
                throw new Error(
                    "Provider rate limit reached"
                );
            }

            const quote =
                data["Global Quote"];

            if (
                !quote ||
                !quote["05. price"]
            ) {
                throw new Error(
                    "No quote"
                );
            }

            results.push({
                symbol:
                    quote["01. symbol"] ||
                    symbol,

                price:
                    Number(
                        quote["05. price"]
                    ),

                change:
                    Number(
                        quote["09. change"]
                    ),

                changePercent:
                    quote["10. change percent"] ||
                    "0%"
            });
        } catch {
            results.push({
                symbol,
                error: true
            });
        }
    }

    renderStocks(results);
}

function renderStocks(results) {
    elements.stocksContent.innerHTML =
        "";

    if (!results.length) {
        renderStocksEmpty();
        return;
    }

    const list =
        document.createElement("div");

    list.className =
        "stock-list";

    results.forEach(stock => {
        const row =
            document.createElement("div");

        row.className =
            "stock-row";

        const identity =
            document.createElement("div");

        const symbol =
            document.createElement("div");

        symbol.className =
            "stock-symbol";

        symbol.textContent =
            stock.symbol;

        const name =
            document.createElement("span");

        name.className =
            "stock-name";

        name.textContent =
            stock.error
                ? "Data unavailable"
                : "Market quote";

        identity.appendChild(symbol);
        identity.appendChild(name);

        const price =
            document.createElement("div");

        price.className =
            "stock-price";

        price.textContent =
            stock.error
                ? "—"
                : formatStockPrice(
                    stock.price
                );

        const change =
            document.createElement("div");

        if (stock.error) {
            change.className =
                "stock-change stock-neutral";

            change.textContent =
                "Unavailable";
        } else {
            const numericChange =
                Number(
                    stock.change || 0
                );

            change.className =
                `stock-change ${
                    numericChange > 0
                        ? "stock-up"
                        : numericChange < 0
                            ? "stock-down"
                            : "stock-neutral"
                }`;

            change.textContent =
                `${numericChange > 0 ? "+" : ""}${numericChange.toFixed(2)} (${stock.changePercent})`;
        }

        row.appendChild(identity);
        row.appendChild(price);
        row.appendChild(change);

        list.appendChild(row);
    });

    elements.stocksContent.appendChild(
        list
    );

    const note =
        document.createElement("div");

    note.className =
        "settings-description";

    note.style.marginTop =
        "12px";

    note.textContent =
        "Market data may be delayed depending on the provider and account.";

    elements.stocksContent.appendChild(
        note
    );
}

function renderStocksEmpty() {
    elements.stocksContent.innerHTML = `
        <div class="widget-empty">
            <span class="widget-icon">↗</span>
            <p>Add stocks and a provider in Settings.</p>
            <button id="stockAddButtonInner" class="primary-small-button">
                Configure
            </button>
        </div>
    `;

    document
        .getElementById(
            "stockAddButtonInner"
        )
        .addEventListener(
            "click",
            openSettings
        );
}

function formatStockPrice(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }

    return new Intl.NumberFormat(
        undefined,
        {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }
    ).format(value);
}

function openModeModal() {
    elements.modeNameInput.value = "";
    elements.modeKeywordsInput.value = "";
    elements.modeDomainsInput.value = "";
    elements.modeFreshnessInput.value = "0";
    elements.modeTechnicalInput.value = "0";

    openModal(elements.modeModal);
}

function saveCustomMode() {
    const name =
        elements.modeNameInput.value.trim();

    if (!name) {
        showToast(
            "Enter a mode name"
        );

        return;
    }

    const id =
        `custom_${Date.now()}`;

    const mode = {
        id,
        name,

        keywords:
            elements.modeKeywordsInput.value
                .split(",")
                .map(value =>
                    value.trim()
                )
                .filter(Boolean),

        domains:
            elements.modeDomainsInput.value
                .split(",")
                .map(value =>
                    value.trim()
                )
                .filter(Boolean),

        freshness:
            Number(
                elements.modeFreshnessInput.value ||
                0
            ),

        technical:
            Number(
                elements.modeTechnicalInput.value ||
                0
            )
    };

    settings.customModes.push(
        mode
    );

    settings.mode = id;

    saveSettings();

    addCustomModeToSelect(mode);

    elements.modeSelect.value =
        id;

    closeModal("modeModal");

    showToast("Mode created");

    if (state.query) {
        renderCurrentResults();
    }
}

function addCustomModeToSelect(mode) {
    const existing =
        [...elements.modeSelect.options]
            .find(
                option =>
                    option.value ===
                    mode.id
            );

    if (existing) {
        return;
    }

    const option =
        document.createElement("option");

    option.value =
        mode.id;

    option.textContent =
        mode.name;

    option.dataset.customMode =
        "true";

    elements.modeSelect.appendChild(
        option
    );
}

function populateCustomModes() {
    settings.customModes.forEach(
        addCustomModeToSelect
    );
}

function startCustomization() {
    closeSettings();

    state.customization =
        true;

    document.body.classList.add(
        "customizing"
    );

    elements.customizeUiButton.classList.add(
        "hidden"
    );

    elements.saveLayoutButton.classList.remove(
        "hidden"
    );

    elements.cancelLayoutButton.classList.remove(
        "hidden"
    );

    enableDragElements();
}

function enableDragElements() {
    const draggable = [
        document.querySelector(
            ".home-logo"
        ),

        document.querySelector(
            ".home-search-form"
        ),

        ...document.querySelectorAll(
            "[data-widget]"
        )
    ].filter(Boolean);

    draggable.forEach(element => {
        element.draggable = true;

        element.addEventListener(
            "dragstart",
            handleDragStart
        );

        element.addEventListener(
            "dragend",
            handleDragEnd
        );

        element.addEventListener(
            "dragover",
            handleDragOver
        );

        element.addEventListener(
            "drop",
            handleDrop
        );
    });
}

function handleDragStart(event) {
    if (!state.customization) {
        event.preventDefault();
        return;
    }

    state.draggedElement =
        event.currentTarget;

    event.currentTarget.classList.add(
        "dragging"
    );

    event.dataTransfer.effectAllowed =
        "move";
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove(
        "dragging"
    );

    state.draggedElement = null;
}

function handleDragOver(event) {
    if (!state.customization) {
        return;
    }

    event.preventDefault();
}

function handleDrop(event) {
    if (
        !state.customization ||
        !state.draggedElement
    ) {
        return;
    }

    event.preventDefault();

    const target =
        event.currentTarget;

    if (
        target ===
        state.draggedElement
    ) {
        return;
    }

    const parent =
        target.parentElement;

    const rect =
        target.getBoundingClientRect();

    const after =
        event.clientY >
        rect.top +
        rect.height / 2;

    if (after) {
        parent.insertBefore(
            state.draggedElement,
            target.nextSibling
        );
    } else {
        parent.insertBefore(
            state.draggedElement,
            target
        );
    }
}

function saveLayout() {
    const widgets =
        [
            ...document.querySelectorAll(
                "[data-widget]"
            )
        ].map(
            widget =>
                widget.dataset.widget
        );

    settings.layout = {
        widgets
    };

    saveSettings();

    finishCustomization();

    showToast(
        "Layout saved"
    );
}

function cancelCustomization() {
    finishCustomization();
    applySavedLayout();
}

function finishCustomization() {
    state.customization =
        false;

    document.body.classList.remove(
        "customizing"
    );

    elements.customizeUiButton.classList.remove(
        "hidden"
    );

    elements.saveLayoutButton.classList.add(
        "hidden"
    );

    elements.cancelLayoutButton.classList.add(
        "hidden"
    );

    document
        .querySelectorAll("[draggable]")
        .forEach(element => {
            element.draggable = false;
        });
}

function applySavedLayout() {
    const order =
        settings.layout?.widgets;

    if (
        !Array.isArray(order) ||
        !order.length
    ) {
        return;
    }

    const grid =
        document.getElementById(
            "homeWidgets"
        );

    for (const widgetId of order) {
        const widget =
            document.querySelector(
                `[data-widget="${CSS.escape(widgetId)}"]`
            );

        if (widget) {
            grid.appendChild(widget);
        }
    }
}

function exportSettings() {
    const blob =
        new Blob(
            [
                JSON.stringify(
                    settings,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const anchor =
        document.createElement("a");

    anchor.href = url;

    anchor.download =
        "seerch-settings.json";

    anchor.click();

    URL.revokeObjectURL(url);
}

async function importSettings(event) {
    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const text =
            await file.text();

        const imported =
            JSON.parse(text);

        settings =
            mergeSettings(
                DEFAULT_SETTINGS,
                imported
            );

        saveSettings();

        applySettings();

        populateSettingsUI();

        document
            .querySelectorAll(
                "#modeSelect option[data-custom-mode]"
            )
            .forEach(option =>
                option.remove()
            );

        populateCustomModes();

        applySavedLayout();

        if (settings.weatherLocation) {
            loadWeather();
        } else {
            renderWeatherEmpty();
        }

        if (settings.stockSymbols.length) {
            loadStocks();
        } else {
            renderStocksEmpty();
        }

        showToast(
            "Settings imported"
        );
    } catch {
        showToast(
            "Could not import settings"
        );
    }

    event.target.value = "";
}

function resetSettings() {
    const confirmed =
        window.confirm(
            "Reset all SEErch² settings stored in this browser?"
        );

    if (!confirmed) {
        return;
    }

    settings =
        structuredClone(
            DEFAULT_SETTINGS
        );

    localStorage.removeItem(
        "seerch_settings"
    );

    localStorage.removeItem(
        "seerch_custom_font"
    );

    saveSettings();

    applySettings();

    document
        .querySelectorAll(
            "#modeSelect option[data-custom-mode]"
        )
        .forEach(option =>
            option.remove()
        );

    populateSettingsUI();

    renderWeatherEmpty();
    renderStocksEmpty();

    showToast(
        "Settings reset"
    );
}

function handleKeyboard(event) {
    if (
        event.key === "/" &&
        document.activeElement?.tagName !==
            "INPUT"
    ) {
        event.preventDefault();

        const input =
            elements.resultsPage.classList.contains(
                "hidden"
            )
                ? elements.homeSearchInput
                : elements.topSearchInput;

        input.focus();
    }

    if (
        (event.ctrlKey ||
            event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {
        event.preventDefault();

        const input =
            elements.resultsPage.classList.contains(
                "hidden"
            )
                ? elements.homeSearchInput
                : elements.topSearchInput;

        input.focus();
    }

    if (event.key === "Escape") {
        closeSettings();
        closeModal(
            "customThemeModal"
        );
        closeModal(
            "locationModal"
        );
        closeModal(
            "modeModal"
        );
        closeImageViewer();
    }
}

function openImageViewer(index) {
    const image =
        state.imageItems[index];

    if (!image) {
        return;
    }

    elements.viewerImage.src =
        image.url;

    elements.viewerImage.alt =
        image.title ||
        image.pageTitle ||
        "Image";

    elements.viewerImageTitle.textContent =
        image.title ||
        image.pageTitle ||
        "Image";

    elements.viewerImageSource.textContent =
        image.pageUrl ||
        "";

    elements.viewerImageDownload.href =
        image.url;

    elements.viewerImageUrl.href =
        image.url;

    elements.viewerImagePage.href =
        image.pageUrl ||
        "#";

    elements.imageViewer.classList.remove(
        "hidden"
    );
}

function closeImageViewer() {
    elements.imageViewer.classList.add(
        "hidden"
    );

    elements.viewerImage.src = "";
}

function goHome() {
    elements.resultsPage.classList.add(
        "hidden"
    );

    elements.homePage.classList.remove(
        "hidden"
    );

    elements.topSearchWrap.classList.add(
        "hidden"
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function saveHistory(query) {
    let history = [];

    try {
        history =
            JSON.parse(
                localStorage.getItem(
                    "seerch_history"
                ) || "[]"
            );
    } catch {
        history = [];
    }

    history = [
        query,
        ...history.filter(
            item => item !== query
        )
    ].slice(0, 100);

    localStorage.setItem(
        "seerch_history",
        JSON.stringify(history)
    );
}

function loadSettings() {
    let stored = {};

    try {
        stored =
            JSON.parse(
                localStorage.getItem(
                    "seerch_settings"
                ) || "{}"
            );
    } catch {
        stored = {};
    }

    return mergeSettings(
        DEFAULT_SETTINGS,
        stored
    );
}

function mergeSettings(
    base,
    override
) {
    const result =
        structuredClone(base);

    if (
        !override ||
        typeof override !== "object"
    ) {
        return result;
    }

    Object.keys(result).forEach(
        key => {
            if (
                override[key] ===
                undefined
            ) {
                return;
            }

            if (
                result[key] &&
                typeof result[key] ===
                    "object" &&
                !Array.isArray(
                    result[key]
                ) &&
                override[key] &&
                typeof override[key] ===
                    "object" &&
                !Array.isArray(
                    override[key]
                )
            ) {
                result[key] = {
                    ...result[key],
                    ...override[key]
                };
            } else {
                result[key] =
                    override[key];
            }
        }
    );

    return result;
}

function saveSettings() {
    localStorage.setItem(
        "seerch_settings",
        JSON.stringify(settings)
    );
}

function showToast(message) {
    elements.toast.textContent =
        message;

    elements.toast.classList.add(
        "show"
    );

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(() => {
            elements.toast.classList.remove(
                "show"
            );
        }, 2500);
}

function arrayBufferToBase64(buffer) {
    let binary = "";

    const bytes =
        new Uint8Array(buffer);

    const chunkSize =
        0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {
        binary += String.fromCharCode(
            ...bytes.subarray(
                i,
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
            )
        );
    }

    return btoa(binary);
}

function adjustColor(
    hex,
    amount
) {
    const value =
        hex.replace("#", "");

    if (value.length !== 6) {
        return hex;
    }

    const num =
        parseInt(value, 16);

    const r =
        Math.max(
            0,
            Math.min(
                255,
                ((num >> 16) & 255) +
                    amount
            )
        );

    const g =
        Math.max(
            0,
            Math.min(
                255,
                ((num >> 8) & 255) +
                    amount
            )
        );

    const b =
        Math.max(
            0,
            Math.min(
                255,
                (num & 255) +
                    amount
            )
        );

    return `#${[
        r,
        g,
        b
    ]
        .map(
            value =>
                value
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("")}`;
      }
