const API_URL = "https://seerchsqapi.darkyproton.workers.dev";
const DB_NAME = "seerchsq";
const DB_VERSION = 1;

const QUOTES = [
["Curiosity turns a search into a discovery.","SEErch²"],
["A useful answer starts with a precise question.","SEErch²"],
["Good search finds information. Better search helps you explore.","SEErch²"],
["Build tools that make the next question easier.","SEErch²"],
["Small improvements compound into better tools.","SEErch²"],
["The best search engine is the one that gets out of your way.","SEErch²"],
["Keep asking better questions.","SEErch²"]
];

const DEFAULTS = {
theme: "system",
font: "Inter,system-ui,sans-serif",
colors: {
bg: "#f5f6f8",
surface: "#ffffff",
surface2: "#eef0f3",
text: "#15171a",
muted: "#6b7078",
border: "#d9dce1",
accent: "#316ff6",
accentText: "#ffffff"
},
customCss: "",
customCssEnabled: false,
historyEnabled: true,
historyLimit: 100,
loadingMode: "infinite",
safeSearch: "normal",
easterEggs: true,
wallpaper: null,
wallpaperEnabled: false,
wallpaperDim: 0.25,
music: null,
musicEnabled: false,
musicVolume: 0.15,
musicLoop: true,
weather: null,
stocks: {
provider: "alphavantage",
apiKey: "",
symbols: []
},
modes: [],
activeMode: "default",
widgets: [],
homepage: [
{id:"quote",type:"quote",visible:true,size:"full"},
{id:"weather",type:"weather",visible:true,size:"half"},
{id:"stocks",type:"stocks",visible:true,size:"half"}
],
results: {
showDescription: true,
showUrl: true,
showScore: true,
compact: false
},
ai: {
enabled: false,
provider: "",
endpoint: "",
model: "",
key: ""
}
};

let db;
let settings;
let state = {
query: "",
tab: "web",
page: 1,
limit: 20,
results: [],
loading: false,
hasMore: true,
audio: null
};

function $(id) {
return document.getElementById(id);
}

function deepCopy(value) {
return JSON.parse(JSON.stringify(value));
}

function merge(base, extra) {
const result = deepCopy(base);

Object.entries(extra || {}).forEach(([key,value]) => {
if (
value &&
typeof value === "object" &&
!Array.isArray(value) &&
result[key] &&
typeof result[key] === "object" &&
!Array.isArray(result[key])
) {
result[key] = merge(result[key], value);
} else {
result[key] = value;
}
});

return result;
}

function openDatabase() {
return new Promise((resolve,reject) => {
const request = indexedDB.open(DB_NAME,DB_VERSION);

request.onupgradeneeded = () => {
const database = request.result;

[
"settings",
"history",
"modes",
"widgets"
].forEach(name => {
if (!database.objectStoreNames.contains(name)) {
database.createObjectStore(name,{keyPath:"id"});
}
});
};

request.onsuccess = () => resolve(request.result);
request.onerror = () => reject(request.error);
});
}

function get(store,id) {
return new Promise((resolve,reject) => {
const transaction = db.transaction(store,"readonly");
const request = transaction.objectStore(store).get(id);

request.onsuccess = () => resolve(request.result || null);
request.onerror = () => reject(request.error);
});
}

function put(store,value) {
return new Promise((resolve,reject) => {
const transaction = db.transaction(store,"readwrite");
transaction.objectStore(store).put(value);
transaction.oncomplete = () => resolve();
transaction.onerror = () => reject(transaction.error);
});
}

function remove(store,id) {
return new Promise((resolve,reject) => {
const transaction = db.transaction(store,"readwrite");
transaction.objectStore(store).delete(id);
transaction.oncomplete = () => resolve();
transaction.onerror = () => reject(transaction.error);
});
}

function all(store) {
return new Promise((resolve,reject) => {
const transaction = db.transaction(store,"readonly");
const request = transaction.objectStore(store).getAll();

request.onsuccess = () => resolve(request.result || []);
request.onerror = () => reject(request.error);
});
}

async function loadSettings() {
const saved = await get("settings","main");
settings = merge(DEFAULTS,saved ? saved.value : {});
await saveSettings();
}

async function saveSettings() {
await put("settings",{id:"main",value:settings});
applySettings();
}

function applySettings() {
const root = document.documentElement;

root.style.setProperty("--font",settings.font);

Object.entries(settings.colors).forEach(([key,value]) => {
root.style.setProperty("--"+key.replace(/[A-Z]/g,m => "-"+m.toLowerCase()),value);
});

if (settings.theme === "dark") {
setDarkMode();
} else if (settings.theme === "light") {
setLightMode();
} else {
window.matchMedia("(prefers-color-scheme: dark)").matches
? setDarkMode()
: setLightMode();
}

applyCustomCss();
applyWallpaper();
}

function setDarkMode() {
const root = document.documentElement;

root.style.setProperty("--bg","#101216");
root.style.setProperty("--surface","#181b21");
root.style.setProperty("--surface2","#22262d");
root.style.setProperty("--text","#f2f4f7");
root.style.setProperty("--muted","#a5abb5");
root.style.setProperty("--border","#303640");
root.style.setProperty("--accent","#78a6ff");
root.style.setProperty("--accentText","#0b1220");
}

function setLightMode() {
const root = document.documentElement;

Object.entries(settings.colors).forEach(([key,value]) => {
root.style.setProperty("--"+key.replace(/[A-Z]/g,m => "-"+m.toLowerCase()),value);
});
}

function applyCustomCss() {
let style = document.getElementById("customUserCss");

if (!style) {
style = document.createElement("style");
style.id = "customUserCss";
document.head.appendChild(style);
}

style.textContent = settings.customCssEnabled ? settings.customCss : "";
}

function applyWallpaper() {
const wallpaper = $("wallpaper");

if (settings.wallpaperEnabled && settings.wallpaper) {
wallpaper.style.backgroundImage = "url("${settings.wallpaper}")";
wallpaper.style.setProperty("--wallpaper-dim",settings.wallpaperDim);
} else {
wallpaper.style.backgroundImage = "none";
wallpaper.style.setProperty("--wallpaper-dim","0");
}
}

function showToast(text) {
const toast = $("toast");

toast.textContent = text;
toast.classList.remove("hidden");

clearTimeout(showToast.timer);

showToast.timer = setTimeout(() => {
toast.classList.add("hidden");
},2500);
}

function openModal(title,content) {
$("modal").innerHTML = `

<div class="modal-box">
<div class="modal-header">
<h2>${escapeHtml(title)}</h2>
<button type="button" id="modalClose">Close</button>
</div>
<div class="modal-body">${content}</div>
</div>
`;$("modal").classList.remove("hidden");

$("modalClose").onclick = closeModal;
}

function closeModal() {
$("modal").classList.add("hidden");
$("modal").innerHTML = "";
}

function escapeHtml(value) {
return String(value ?? "").replace(/[&<>"']/g,char => ({
"&":"&",
"<":"<",
">":">",
'"':""",
"'":"'"
}[char]));
}

function escapeAttribute(value) {
return escapeHtml(value);
}

function showHome() {
$("homePage").classList.remove("hidden");
$("resultsPage").classList.add("hidden");
}

function showResults() {
$("homePage").classList.add("hidden");
$("resultsPage").classList.remove("hidden");
}

async function search(query,append=false) {
query = query.trim();

if (!query) return;

if (!append) {
state.query = query;
state.page = 1;
state.results = [];
state.hasMore = true;
}

showResults();

$("resultsSearch").value = query;
renderResults();

state.loading = true;

try {
const url = new URL("${API_URL}/search");

url.searchParams.set("q",query);
url.searchParams.set("page",String(state.page));
url.searchParams.set("limit",String(state.limit));

const response = await fetch(url.toString(),{
method:"GET",
headers:{
Accept:"application/json"
}
});

if (!response.ok) {
throw new Error("Search failed: ${response.status}");
}

const data = await response.json();

let incoming = Array.isArray(data.results) ? data.results : [];

incoming = applyMode(incoming);

if (append) {
state.results.push(...incoming);
} else {
state.results = incoming;
}

state.hasMore = incoming.length >= state.limit;

if (!append && settings.historyEnabled) {
await saveHistory(query);
}

} catch (error) {
showToast(error.message || "Search failed");
} finally {
state.loading = false;
renderResults();
}
}

async function nextPage() {
if (state.loading || !state.hasMore) return;

state.page += 1;

await search(state.query,true);
}

function applyMode(results) {
if (settings.activeMode === "default") {
return results;
}

const mode = settings.modes.find(item => item.id === settings.activeMode);

if (!mode) {
return results;
}

return results
.map(result => {
let bonus = 0;

const text = "${result.title || ""} ${result.description || ""} ${result.url || ""}".toLowerCase();

for (const keyword of mode.keywords) {
if (keyword && text.includes(keyword.toLowerCase())) {
bonus += mode.keywordWeight;
}
}

for (const domain of mode.domains) {
try {
const hostname = new URL(result.url).hostname.toLowerCase();

if (domain && hostname.includes(domain.toLowerCase())) {
bonus += mode.domainWeight;
}
} catch {}
}

if (mode.technical && /(api|documentation|developer|github|programming|software|technical)/i.test(text)) {
bonus += mode.technical;
}

return {
...result,
_modeScore: Number(result.score || 0) + bonus
};
})
.sort((a,b) => (b._modeScore || 0) - (a._modeScore || 0));
}

function getFilteredResults() {
if (state.tab === "web") {
return state.results;
}

if (state.tab === "images") {
return state.results.filter(result => Array.isArray(result.images) && result.images.length > 0);
}

if (state.tab === "videos") {
return state.results.filter(result => Array.isArray(result.videos) && result.videos.length > 0);
}

if (state.tab === "news") {
return state.results.filter(result => {
const text = "${result.url || ""} ${result.title || ""} ${result.description || ""}";

return /news|bbc|reuters|apnews|cnn|guardian|nytimes|washingtonpost/i.test(text);
});
}

return [];
}

function renderResults() {
const results = getFilteredResults();

$("resultsInfo").textContent = state.query
? "${state.query} · ${results.length} loaded"
: "";

if (!state.query) {
$("results").innerHTML = "";
return;
}

if (!results.length) {
$("results").innerHTML = state.loading
? "<div class="empty">Searching...</div>"
: "<div class="empty">No results for this tab.</div>";

renderLoadMore();
return;
}

$("results").innerHTML = results.map(renderResult).join("");

renderLoadMore();
}

function renderResult(result) {
const title = escapeHtml(result.title || result.url || "Untitled");
const url = escapeHtml(result.url || "");
const description = escapeHtml(result.description || "");
const score = Number(result._modeScore ?? result.score ?? 0).toFixed(3);

let html = "<article class="result">";

html += "<a class="result-title" href="${escapeAttribute(result.url || "#")}" target="_blank" rel="noopener noreferrer">${title}</a>";

if (settings.results.showUrl) {
html += "<div class="result-url">${url}</div>";
}

if (settings.results.showDescription && description) {
html += "<div class="result-description">${description}</div>";
}

if (settings.results.showScore) {
html += "<div class="result-score">Score ${score}</div>";
}

if (state.tab === "images") {
html += renderImages(result);
} else if (state.tab === "videos") {
html += renderVideos(result);
} else {
html += renderPreviewMedia(result);
}

html += "</article>";

return html;
}

function renderPreviewMedia(result) {
if (
(!result.images || !result.images.length) &&
(!result.videos || !result.videos.length)
) {
return "";
}

return `<div class="media-grid">
${renderImages(result,3)}
${renderVideos(result,3)}

</div>`;
}function renderImages(result,max=100) {
if (!Array.isArray(result.images)) {
return "";
}

return result.images.slice(0,max).map((image,index) => {
if (!image || !image.url) {
return "";
}

const alt = image.alt || image.title || "Image";

return `

<div class="media">
<button type="button" class="open-image" data-id="${escapeAttribute(result.id)}" data-index="${index}">
<img
src="${escapeAttribute(image.url)}"
alt="${escapeAttribute(alt)}"
loading="lazy"
referrerpolicy="no-referrer"
onerror="this.closest('.media').classList.add('image-error')"
>
<div class="media-label">${escapeHtml(alt)}</div>
</button>
</div>`;
}).join("");
}function renderVideos(result,max=100) {
if (!Array.isArray(result.videos)) {
return "";
}

return result.videos.slice(0,max).map((video,index) => {
if (!video || !video.url) {
return "";
}

const title = video.title || "Video";

return `

<div class="media">
<button type="button" class="open-video" data-id="${escapeAttribute(result.id)}" data-index="${index}">
${
video.thumbnail
? `<img src="${escapeAttribute(video.thumbnail)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
: `<div class="video-placeholder">Video</div>`
}
<div class="media-label">${escapeHtml(title)}</div>
</button>
</div>`;
}).join("");
}function openImage(resultId,index) {
const result = state.results.find(item => String(item.id) === String(resultId));

const image = result?.images?.[index];

if (!image?.url) {
return;
}

openModal("Image",`
<img
src="${escapeAttribute(image.url)}"
alt="${escapeAttribute(image.alt || image.title || "Image")}"
style="display:block;width:100%;max-height:65vh;object-fit:contain;border-radius:12px;background:var(--surface2)"
referrerpolicy="no-referrer"

«»

<p>${escapeHtml(image.alt || image.title || "")}</p>
<div class="button-row">
<a href="${escapeAttribute(image.url)}" target="_blank" rel="noopener noreferrer"><button type="button">View image</button></a>
<a href="${escapeAttribute(image.url)}" download><button type="button">Download</button></a>
<a href="${escapeAttribute(result.url)}" target="_blank" rel="noopener noreferrer"><button type="button">Source page</button></a>
</div>
`);
}function openVideo(resultId,index) {
const result = state.results.find(item => String(item.id) === String(resultId));

const video = result?.videos?.[index];

if (video?.url) {
window.open(video.url,"_blank","noopener,noreferrer");
}
}

async function saveHistory(query) {
const entry = {
id: crypto.randomUUID(),
query,
createdAt: Date.now()
};

await put("history",entry);

const entries = await all("history");

entries
.sort((a,b) => b.createdAt - a.createdAt)
.slice(settings.historyLimit)
.forEach(entry => remove("history",entry.id));
}

async function showHistory() {
const history = (await all("history"))
.sort((a,b) => b.createdAt - a.createdAt);

if (!history.length) {
openModal("History","<div class="empty">No search history.</div>");
return;
}

openModal("History",`

<div class="editor-list">
${history.map(item => `
<div class="editor-item">
<div class="editor-item-head">
<button type="button" class="history-search" data-query="${escapeAttribute(item.query)}">${escapeHtml(item.query)}</button>
<span>${new Date(item.createdAt).toLocaleString()}</span>
</div>
</div>
`).join("")}
</div>
`);document.querySelectorAll(".history-search").forEach(button => {
button.onclick = () => {
const query = button.dataset.query;
closeModal();
search(query);
};
});
}

async function clearHistory() {
const entries = await all("history");

for (const entry of entries) {
await remove("history",entry.id);
}

showToast("History cleared");
}

function randomQuote() {
const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

return `

<div class="widget full">
<div class="widget-title">Quote</div>
<div class="quote">“${escapeHtml(quote[0])}”</div>
<div class="quote-author">${escapeHtml(quote[1])}</div>
<div class="widget-footer">
<button type="button" id="refreshQuote">Refresh</button>
</div>
</div>`;
}function renderHome() {
const visible = settings.homepage.filter(item => item.visible !== false);

$("homeWidgets").innerHTML = visible.map(item => {
if (item.type === "quote") {
return randomQuote();
}

if (item.type === "weather") {
return `<div class="widget ${item.size === "full" ? "full" : item.size === "third" ? "third" : ""}">

<div class="widget-title">Weather</div>
<div id="weatherWidget"><div class="empty">Add a location in Settings.</div></div>
</div>`;
}if (item.type === "stocks") {
return `<div class="widget ${item.size === "full" ? "full" : item.size === "third" ? "third" : ""}">

<div class="widget-title">Stocks</div>
<div id="stocksWidget"><div class="empty">Configure stocks in Settings.</div></div>
</div>`;
}if (item.type === "custom") {
const widget = settings.widgets.find(w => w.id === item.widgetId);

if (!widget) return "";

return `

<div class="widget ${item.size === "full" ? "full" : item.size === "third" ? "third" : ""}">
<div id="widget-${escapeAttribute(widget.id)}"></div>
</div>`;
}return "";
}).join("");

const refresh = $("refreshQuote");

if (refresh) {
refresh.onclick = renderHome;
}

renderWeather();
renderStocks();
renderCustomWidgets();
}

async function renderWeather() {
const container = $("weatherWidget");

if (!container || !settings.weather) {
return;
}

const weather = settings.weather;

try {
const url = new URL("https://api.open-meteo.com/v1/forecast");

url.searchParams.set("latitude",weather.latitude);
url.searchParams.set("longitude",weather.longitude);
url.searchParams.set("current","temperature_2m,relative_humidity_2m,wind_speed_10m");
url.searchParams.set("timezone","auto");

const response = await fetch(url);
const data = await response.json();

container.innerHTML = `

<div><strong>${escapeHtml(weather.name)}</strong></div>
<div style="font-size:34px;margin-top:8px">${Math.round(data.current.temperature_2m)}°</div>
<div class="quote-author">
Humidity ${Math.round(data.current.relative_humidity_2m)}%
· Wind ${Math.round(data.current.wind_speed_10m)} km/h
</div>`;
} catch {
container.innerHTML = `<div class="empty">Weather unavailable.</div>`;
}
}async function renderStocks() {
const container = $("stocksWidget");

if (!container) {
return;
}

if (!settings.stocks.apiKey || !settings.stocks.symbols.length) {
return;
}

const rows = [];

for (const symbol of settings.stocks.symbols.slice(0,8)) {
try {
const url = new URL("https://www.alphavantage.co/query");

url.searchParams.set("function","GLOBAL_QUOTE");
url.searchParams.set("symbol",symbol);
url.searchParams.set("apikey",settings.stocks.apiKey);

const response = await fetch(url);
const data = await response.json();

const quote = data["Global Quote"] || {};

rows.push(`

<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)">
<span>${escapeHtml(symbol)}</span>
<strong>${escapeHtml(quote["05. price"] || "Unavailable")}</strong>
</div>`);
} catch {
rows.push(`<div>${escapeHtml(symbol)} unavailable</div>`);
}
}container.innerHTML = rows.join("");
}

function renderCustomWidgets() {
settings.widgets.forEach(widget => {
const target = document.getElementById("widget-${widget.id}");

if (!target) return;

target.innerHTML = `

<div class="widget-title">${escapeHtml(widget.title || widget.name)}</div>
${widget.text ? `<div>${escapeHtml(widget.text)}</div>` : ""}
${widget.html || ""}
`;if (widget.css) {
const style = document.createElement("style");
style.textContent = widget.css;
target.appendChild(style);
}

if (widget.script) {
try {
const functionBody = new Function(
"element",
"SEErch",
widget.script
);

functionBody(target,{
version:"1",
toast:showToast,
storage:{
get,
put,
all
}
});
} catch(error) {
target.insertAdjacentHTML(
"beforeend",
"<div class="quote-author">Widget error: ${escapeHtml(error.message)}</div>"
);
}
}
}

function setupMusic() {
if (state.audio) {
state.audio.pause();
state.audio.remove();
state.audio = null;
}

if (!settings.musicEnabled || !settings.music) {
return;
}

const audio = new Audio(settings.music);
audio.loop = settings.musicLoop;
audio.volume = settings.musicVolume;
audio.preload = "auto";

document.body.appendChild(audio);
state.audio = audio;

const start = () => {
audio.play().catch(() => {});
};

document.addEventListener("pointerdown",start,{once:true});
document.addEventListener("keydown",start,{once:true});
}

function openThemeEditor() {
const fields = Object.entries(settings.colors).map(([name,value]) => "<label> ${escapeHtml(name)} <input type="color" data-theme-color="${escapeAttribute(name)}" value="${escapeAttribute(value)}"> </label>").join("");

openModal("Custom theme",`

<div class="color-grid">${fields}</div>
<div class="button-row">
<button id="saveTheme" type="button">Save theme</button>
</div>
`);$("saveTheme").onclick = async () => {
document.querySelectorAll("[data-theme-color]").forEach(input => {
settings.colors[input.dataset.themeColor] = input.value;
});

settings.theme = "light";

await saveSettings();
closeModal();
showToast("Theme saved");
};
}

function openFontEditor() {
openModal("Font",`
<label>
Font stack
<input id="fontStack" value="${escapeAttribute(settings.font)}">
</label>

<div class="button-row">
<button id="saveFont" type="button">Save</button>
<button id="importFont" type="button">Import font</button>
</div>
`);$("saveFont").onclick = async () => {
settings.font = $("fontStack").value.trim() || DEFAULTS.font;
await saveSettings();
closeModal();
};

$("importFont").onclick = () => {
const input = document.createElement("input");

input.type = "file";
input.accept = ".woff,.woff2,.ttf,.otf";

input.onchange = async () => {
const file = input.files[0];

if (!file) return;

const buffer = await file.arrayBuffer();
const url = URL.createObjectURL(new Blob([buffer],{type:file.type}));
const face = new FontFace("SEErchCustom","url(${url})");

await face.load();

document.fonts.add(face);

settings.font = "SEErchCustom,system-ui,sans-serif";

await saveSettings();

closeModal();
showToast("Font imported");
};

input.click();
}

function openWallpaperEditor() {
openModal("Wallpaper",`
<label>
Image
<input id="wallpaperFile" type="file" accept="image/*">
</label>

<label>
Dimming
<input id="wallpaperDim" type="range" min="0" max=".9" step=".05" value="${settings.wallpaperDim}">
</label><label class="check-row">
<span>Enable wallpaper</span>
<input id="wallpaperEnabled" type="checkbox" ${settings.wallpaperEnabled ? "checked" : ""}>
</label><div class="button-row">
<button id="saveWallpaper" type="button">Save</button>
<button id="removeWallpaper" type="button">Remove</button>
</div>
`);$("saveWallpaper").onclick = async () => {
const file = $("wallpaperFile").files[0];

if (file) {
settings.wallpaper = await fileToDataURL(file);
}

settings.wallpaperDim = Number($("wallpaperDim").value);
settings.wallpaperEnabled = $("wallpaperEnabled").checked;

await saveSettings();

closeModal();
};

$("removeWallpaper").onclick = async () => {
settings.wallpaper = null;
settings.wallpaperEnabled = false;

await saveSettings();

closeModal();
};
}

function openMusicEditor() {
openModal("Background music",`
<label>
Audio file
<input id="musicFile" type="file" accept="audio/*">
</label>

<label>
Volume
<input id="musicVolume" type="range" min="0" max="1" step=".01" value="${settings.musicVolume}">
</label><label class="check-row">
<span>Enable music</span>
<input id="musicEnabled" type="checkbox" ${settings.musicEnabled ? "checked" : ""}>
</label><label class="check-row">
<span>Loop</span>
<input id="musicLoop" type="checkbox" ${settings.musicLoop ? "checked" : ""}>
</label><div class="button-row">
<button id="saveMusic" type="button">Save</button>
<button id="removeMusic" type="button">Remove</button>
</div>
`);$("saveMusic").onclick = async () => {
const file = $("musicFile").files[0];

if (file) {
settings.music = await fileToDataURL(file);
}

settings.musicVolume = Number($("musicVolume").value);
settings.musicEnabled = $("musicEnabled").checked;
settings.musicLoop = $("musicLoop").checked;

await saveSettings();
setupMusic();

closeModal();
};

$("removeMusic").onclick = async () => {
settings.music = null;
settings.musicEnabled = false;

await saveSettings();
setupMusic();

closeModal();
};
}

function openCssEditor() {
openModal("Custom CSS",`
<label>
Stylesheet

<textarea id="customCss" style="min-height:350px">${escapeHtml(settings.customCss)}</textarea></label><label class="check-row">
<span>Enable custom CSS</span>
<input id="customCssEnabled" type="checkbox" ${settings.customCssEnabled ? "checked" : ""}>
</label><div class="button-row">
<button id="saveCss" type="button">Save CSS</button>
<button id="importCss" type="button">Import .css</button>
</div>
`);$("saveCss").onclick = async () => {
settings.customCss = $("customCss").value;
settings.customCssEnabled = $("customCssEnabled").checked;

await saveSettings();

closeModal();
};

$("importCss").onclick = () => {
const input = document.createElement("input");

input.type = "file";
input.accept = ".css,text/css";

input.onchange = async () => {
settings.customCss = await input.files[0].text();
$("customCss").value = settings.customCss;
};

input.click();
};
}

function openResultsEditor() {
openModal("Results page editor",`
<label class="check-row">
<span>Show descriptions</span>
<input id="resultDescriptions" type="checkbox" ${settings.results.showDescription ? "checked" : ""}>
</label>

<label class="check-row">
<span>Show URLs</span>
<input id="resultUrls" type="checkbox" ${settings.results.showUrl ? "checked" : ""}>
</label><label class="check-row">
<span>Show scores</span>
<input id="resultScores" type="checkbox" ${settings.results.showScore ? "checked" : ""}>
</label><label class="check-row">
<span>Compact results</span>
<input id="resultCompact" type="checkbox" ${settings.results.compact ? "checked" : ""}>
</label><div class="button-row">
<button id="saveResults" type="button">Save</button>
</div>
`);$("saveResults").onclick = async () => {
settings.results.showDescription = $("resultDescriptions").checked;
settings.results.showUrl = $("resultUrls").checked;
settings.results.showScore = $("resultScores").checked;
settings.results.compact = $("resultCompact").checked;

await saveSettings();

closeModal();
renderResults();
};
}

function openHomepageEditor() {
const items = settings.homepage;

openModal("Homepage editor",`

<div class="editor-list">
${items.map((item,index) => `
<div class="editor-item">
<div class="editor-item-head">
<strong>${escapeHtml(item.type)}</strong>
<div class="editor-item-actions">
<button type="button" data-home-up="${index}">Up</button>
<button type="button" data-home-down="${index}">Down</button>
<button type="button" data-home-remove="${index}">X</button>
</div>
</div><label>
Size
<select data-home-size="${index}">
<option value="third">33%</option>
<option value="half">50%</option>
<option value="full">100%</option>
</select>
</label><label class="check-row">
<span>Visible</span>
<input type="checkbox" data-home-visible="${index}" ${item.visible !== false ? "checked" : ""}>
</label>
</div>
`).join("")}
</div><div class="button-row">
<button id="addHomepageWidget" type="button">Add widget</button>
<button id="saveHomepage" type="button">Save</button>
</div>
`);items.forEach((item,index) => {
const size = document.querySelector("[data-home-size="${index}"]");

if (size) {
size.value = item.size || "half";
}
});

document.querySelectorAll("[data-home-up]").forEach(button => {
button.onclick = () => {
const index = Number(button.dataset.homeUp);

if (index > 0) {
[items[index-1],items[index]] = [items[index],items[index-1]];
openHomepageEditor();
}
};
});

document.querySelectorAll("[data-home-down]").forEach(button => {
button.onclick = () => {
const index = Number(button.dataset.homeDown);

if (index < items.length - 1) {
[items[index+1],items[index]] = [items[index],items[index+1]];
openHomepageEditor();
}
};
});

document.querySelectorAll("[data-home-remove]").forEach(button => {
button.onclick = () => {
items.splice(Number(button.dataset.homeRemove),1);
openHomepageEditor();
};
});

document.querySelectorAll("[data-home-size]").forEach(select => {
select.onchange = () => {
items[Number(select.dataset.homeSize)].size = select.value;
};
});

document.querySelectorAll("[data-home-visible]").forEach(input => {
input.onchange = () => {
items[Number(input.dataset.homeVisible)].visible = input.checked;
};
});

$("addHomepageWidget").onclick = () => openWidgetCreator();

$("saveHomepage").onclick = async () => {
settings.homepage = items;
await saveSettings();
closeModal();
renderHome();
};
}

function openWidgetCreator() {
const widget = {
id: crypto.randomUUID(),
name: "Custom Widget",
title: "",
text: "",
html: "",
css: "",
script: ""
};

openModal("Widget creator",`

<div class="form-grid">
<label>
Name
<input id="widgetName">
</label><label>
Title
<input id="widgetTitle">
</label><label>
Text
<input id="widgetText">
</label>
</div><label style="display:grid;gap:7px;margin-top:12px">
HTML
<textarea id="widgetHtml"></textarea>
</label><label style="display:grid;gap:7px;margin-top:12px">
CSS
<textarea id="widgetCss"></textarea>
</label><label style="display:grid;gap:7px;margin-top:12px">
JavaScript
<textarea id="widgetScript"></textarea>
</label><div class="button-row">
<button id="saveWidget" type="button">Save widget</button>
</div>
`);$("saveWidget").onclick = async () => {
widget.name = $("widgetName").value.trim() || "Custom Widget";
widget.title = $("widgetTitle").value;
widget.text = $("widgetText").value;
widget.html = $("widgetHtml").value;
widget.css = $("widgetCss").value;
widget.script = $("widgetScript").value;

settings.widgets.push(widget);

await put("widgets",{id:widget.id,value:widget});
await saveSettings();

closeModal();
showToast("Widget created");
};
}

function importWidgetScript() {
const input = document.createElement("input");

input.type = "file";
input.accept = ".js,text/javascript";

input.onchange = async () => {
const file = input.files[0];

if (!file) return;

const script = await file.text();

const widget = {
id: crypto.randomUUID(),
name: file.name,
title: file.name,
text: "",
html: "",
css: "",
script
};

settings.widgets.push(widget);

await put("widgets",{id:widget.id,value:widget});
await saveSettings();

showToast("Widget imported");
};

input.click();
}

function openWidgetsManager() {
openModal("Widgets",`

<div class="editor-list">
${
settings.widgets.length
? settings.widgets.map(widget => `
<div class="editor-item">
<div class="editor-item-head">
<strong>${escapeHtml(widget.name)}</strong>
<button type="button" data-delete-widget="${escapeAttribute(widget.id)}">X</button>
</div>
</div>
`).join("")
: `<div class="empty">No custom widgets.</div>`
}
</div>
`);document.querySelectorAll("[data-delete-widget]").forEach(button => {
button.onclick = async () => {
const id = button.dataset.deleteWidget;

settings.widgets = settings.widgets.filter(widget => widget.id !== id);
settings.homepage = settings.homepage.filter(item => item.widgetId !== id);

await remove("widgets",id);
await saveSettings();

openWidgetsManager();
};
});
}

function openModeTutorial() {
openModal("How modes work",`

<div class="empty" style="text-align:left">
<p><strong>Truth25 comes first.</strong></p>
<p>SEErch² receives the normal Truth25 ranking from the backend.</p><p><strong>Your mode runs locally.</strong></p>
<p>The browser looks for your selected keywords, domains and technical signals.</p><p><strong>The mode adds a local bonus.</strong></p>
<p>Results matching your preferences move upward among the results that were loaded.</p><p><strong>The index is not changed.</strong></p>
<p>Your mode does not modify Seendex or Truth25.</p><p><strong>Why might a mode appear to do nothing?</strong></p>
<p>If the current query has few results matching the mode, the ordering may remain almost unchanged.</p>
</div>
`);
}function openModeCreator(existing=null) {
const mode = existing || {
id: crypto.randomUUID(),
name: "",
keywords: [],
domains: [],
keywordWeight: 5,
domainWeight: 8,
technical: 3
};

openModal(existing ? "Edit mode" : "Create mode",`

<div class="form-grid"><label>
Name
<input id="modeName" value="${escapeAttribute(mode.name)}">
</label><label>
Keywords
<input id="modeKeywords" value="${escapeAttribute(mode.keywords.join(", "))}" placeholder="ai, programming, software">
</label><label>
Preferred domains
<input id="modeDomains" value="${escapeAttribute(mode.domains.join(", "))}" placeholder="github.com, mozilla.org">
</label><label>
Keyword bonus
<input id="modeKeywordWeight" type="number" value="${mode.keywordWeight}">
</label><label>
Domain bonus
<input id="modeDomainWeight" type="number" value="${mode.domainWeight}">
</label><label>
Technical bonus
<input id="modeTechnical" type="number" value="${mode.technical}">
</label></div><div class="button-row">
<button id="saveMode" type="button">Save mode</button>
</div>
`);$("saveMode").onclick = async () => {
mode.name = $("modeName").value.trim() || "Custom mode";
mode.keywords = $("modeKeywords").value.split(",").map(value => value.trim()).filter(Boolean);
mode.domains = $("modeDomains").value.split(",").map(value => value.trim()).filter(Boolean);
mode.keywordWeight = Number($("modeKeywordWeight").value) || 0;
mode.domainWeight = Number($("modeDomainWeight").value) || 0;
mode.technical = Number($("modeTechnical").value) || 0;

const existingIndex = settings.modes.findIndex(item => item.id === mode.id);

if (existingIndex >= 0) {
settings.modes[existingIndex] = mode;
} else {
settings.modes.push(mode);
}

settings.activeMode = mode.id;

await put("modes",{id:mode.id,value:mode});
await saveSettings();

closeModal();
updateModeSelect();
renderResults();
showToast("Mode saved");
};
}

function updateModeSelect() {
$("modeSelect").innerHTML =
"<option value="default">Default</option>" +
settings.modes.map(mode =>
"<option value="${escapeAttribute(mode.id)}">${escapeHtml(mode.name)}</option>"
).join("");

$("modeSelect").value = settings.activeMode;
}

function openModeManager() {
openModal("Modes",`

<div class="editor-list">
${
settings.modes.length
? settings.modes.map(mode => `
<div class="editor-item">
<div class="editor-item-head">
<strong>${escapeHtml(mode.name)}</strong>
<div class="editor-item-actions">
<button type="button" data-edit-mode="${escapeAttribute(mode.id)}">Edit</button>
<button type="button" data-delete-mode="${escapeAttribute(mode.id)}">X</button>
</div>
</div>
</div>
`).join("")
: `<div class="empty">No custom modes.</div>`
}
</div>
`);document.querySelectorAll("[data-edit-mode]").forEach(button => {
button.onclick = () => {
const mode = settings.modes.find(item => item.id === button.dataset.editMode);

if (mode) {
openModeCreator(mode);
}
};
});

document.querySelectorAll("[data-delete-mode]").forEach(button => {
button.onclick = async () => {
const id = button.dataset.deleteMode;

settings.modes = settings.modes.filter(mode => mode.id !== id);

if (settings.activeMode === id) {
settings.activeMode = "default";
}

await remove("modes",id);
await saveSettings();

updateModeSelect();
openModeManager();
};
});
}

async function findWeather() {
const name = $("weatherCity").value.trim();

if (!name) return;

try {
const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

url.searchParams.set("name",name);
url.searchParams.set("count","5");
url.searchParams.set("language","en");
url.searchParams.set("format","json");

const response = await fetch(url);
const data = await response.json();

const places = data.results || [];

if (!places.length) {
showToast("Location not found");
return;
}

openModal("Choose location",`

<div class="editor-list">
${places.map((place,index) => `
<button type="button" data-place="${index}">
${escapeHtml(place.name)}, ${escapeHtml(place.country || "")}
</button>
`).join("")}
</div>
`);document.querySelectorAll("[data-place]").forEach(button => {
button.onclick = async () => {
const place = places[Number(button.dataset.place)];

settings.weather = {
name: "${place.name}, ${place.country || ""}",
latitude: place.latitude,
longitude: place.longitude
};

await saveSettings();

closeModal();
renderHome();
};
});
} catch {
showToast("Location lookup failed");
}
}

function useBrowserLocation() {
navigator.geolocation.getCurrentPosition(
async position => {
settings.weather = {
name: "Current location",
latitude: position.coords.latitude,
longitude: position.coords.longitude
};

await saveSettings();

renderHome();
showToast("Location saved");
},
() => {
showToast("Location permission was not granted");
}
);
}

function saveAI() {
settings.ai = {
enabled: $("aiEnabled").checked,
provider: $("aiProvider").value.trim(),
endpoint: $("aiEndpoint").value.trim(),
model: $("aiModel").value.trim(),
key: $("aiKey").value
};

saveSettings().then(() => showToast("AI settings saved"));
}

function saveStocks() {
settings.stocks = {
provider: $("stockProvider").value,
apiKey: $("stockKey").value.trim(),
symbols: $("stockSymbols").value
.split(",")
.map(value => value.trim().toUpperCase())
.filter(Boolean)
};

saveSettings().then(() => {
renderHome();
showToast("Stock settings saved");
});
}

function fileToDataURL(file) {
return new Promise((resolve,reject) => {
const reader = new FileReader();

reader.onload = () => resolve(reader.result);
reader.onerror = () => reject(reader.error);

reader.readAsDataURL(file);
});
}

async function exportAll() {
const data = {
settings,
history: await all("history")
};

const blob = new Blob(
[JSON.stringify(data,null,2)],
{type:"application/json"}
);

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = "seerchsq-settings.json";

link.click();

URL.revokeObjectURL(url);
}

async function importAll(file) {
try {
const data = JSON.parse(await file.text());

settings = merge(DEFAULTS,data.settings || {});

await saveSettings();

for (const entry of data.history || []) {
await put("history",entry);
}

updateModeSelect();
renderHome();

showToast("Settings imported");
} catch {
showToast("Invalid settings file");
}
}

function bindSettings() {
$("themeSelect").value = settings.theme;
$("historyEnabled").checked = settings.historyEnabled;
$("historyLimit").value = settings.historyLimit;
$("loadingMode").value = settings.loadingMode;
$("safeSearch").value = settings.safeSearch;
$("easterEggs").checked = settings.easterEggs;

$("aiEnabled").checked = settings.ai.enabled;
$("aiProvider").value = settings.ai.provider;
$("aiEndpoint").value = settings.ai.endpoint;
$("aiModel").value = settings.ai.model;
$("aiKey").value = settings.ai.key;

$("weatherCity").value = settings.weather?.name || "";

$("stockProvider").value = settings.stocks.provider;
$("stockKey").value = settings.stocks.apiKey;
$("stockSymbols").value = settings.stocks.symbols.join(", ");

updateModeSelect();

$("themeSelect").onchange = async event => {
settings.theme = event.target.value;
await saveSettings();
};

$("historyEnabled").onchange = async event => {
settings.historyEnabled = event.target.checked;
await saveSettings();
};

$("historyLimit").onchange = async event => {
settings.historyLimit = Math.max(10,Math.min(1000,Number(event.target.value) || 100));
await saveSettings();
};

$("loadingMode").onchange = async event => {
settings.loadingMode = event.target.value;
await saveSettings();
};

$("safeSearch").onchange = async event => {
settings.safeSearch = event.target.value;
await saveSettings();
};

$("easterEggs").onchange = async event => {
settings.easterEggs = event.target.checked;
await saveSettings();
};

$("modeSelect").onchange = async event => {
settings.activeMode = event.target.value;
await saveSettings();
renderResults();
};

$("themeEditorBtn").onclick = openThemeEditor;
$("fontBtn").onclick = openFontEditor;
$("wallpaperBtn").onclick = openWallpaperEditor;
$("musicBtn").onclick = openMusicEditor;
$("historyBtn").onclick = showHistory;
$("clearHistoryBtn").onclick = clearHistory;
$("resultsEditorBtn").onclick = openResultsEditor;
$("homepageEditorBtn").onclick = openHomepageEditor;
$("widgetCreatorBtn").onclick = openWidgetCreator;
$("scriptWidgetBtn").onclick = importWidgetScript;
$("manageWidgetsBtn").onclick = openWidgetsManager;
$("cssEditorBtn").onclick = openCssEditor;
$("createModeBtn").onclick = () => openModeCreator();
$("modeHelpBtn").onclick = openModeTutorial;
$("manageModesBtn").onclick = openModeManager;
$("findWeather").onclick = findWeather;
$("useLocation").onclick = useBrowserLocation;
$("saveStocks").onclick = saveStocks;
$("saveAI").onclick = saveAI;

$("exportSettings").onclick = exportAll;

$("importSettings").onclick = () => {
$("settingsFile").click();
};

$("settingsFile").onchange = async event => {
const file = event.target.files[0];

if (file) {
await importAll(file);
}

event.target.value = "";
};
}

function bindEvents() {
$("homeSearchForm").onsubmit = event => {
event.preventDefault();
search($("homeSearch").value);
};

$("resultsSearchForm").onsubmit = event => {
event.preventDefault();
search($("resultsSearch").value);
};

$("settingsBtn").onclick = () => {
$("settingsOverlay").classList.remove("hidden");
bindSettings();
};

$("closeSettings").onclick = () => {
$("settingsOverlay").classList.add("hidden");
};

document.querySelectorAll("[data-tab]").forEach(button => {
button.onclick = () => {
state.tab = button.dataset.tab;

document.querySelectorAll("[data-tab]").forEach(item => {
item.classList.toggle("active",item === button);
});

renderResults();
};
});

document.addEventListener("click",event => {
const image = event.target.closest(".open-image");

if (image) {
openImage(image.dataset.id,Number(image.dataset.index));
return;
}

const video = event.target.closest(".open-video");

if (video) {
openVideo(video.dataset.id,Number(video.dataset.index));
return;
}
});

window.addEventListener("scroll",() => {
if (
state.query &&
settings.loadingMode === "infinite" &&
!state.loading &&
state.hasMore &&
window.innerHeight + window.scrollY >= document.body.scrollHeight - 700
) {
nextPage();
}
});
}

function bindEasterEggs() {
let buffer = "";

document.addEventListener("keydown",event => {
if (!settings.easterEggs) return;

buffer += event.key.toLowerCase();

if (buffer.length > 30) {
buffer = buffer.slice(-30);
}

if (buffer.includes("seerch")) {
buffer = "";
showToast("Easter egg found.");
}
});
}

async function initialize() {
db = await openDatabase();

await loadSettings();

bindEvents();
bindSettings();
bindEasterEggs();

applySettings();
renderHome();
setupMusic();

if (location.hash.startsWith("#search=")) {
const query = decodeURIComponent(location.hash.substring(8));

$("homeSearch").value = query;

await search(query);
}
}

document.addEventListener("DOMContentLoaded",initialize);
