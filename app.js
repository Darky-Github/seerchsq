const API_URL="https://seerchsqapi.darkyproton.workers.dev";
const DB_NAME="seerchsq-local";
const DB_VERSION=1;
const QUOTES=[
{t:"The important thing is to keep asking better questions.",a:"SEErch²"},
{t:"Curiosity turns a search into a discovery.",a:"SEErch²"},
{t:"A useful answer starts with a precise question.",a:"SEErch²"},
{t:"Build tools that make the next question easier.",a:"SEErch²"},
{t:"Good search finds information. Better search helps you explore.",a:"SEErch²"},
{t:"Make the interface yours, then make the search yours.",a:"SEErch²"},
{t:"Small improvements compound into better tools.",a:"SEErch²"}
];

const DEFAULT_SETTINGS={
theme:"system",
font:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif",
colors:{bg:"#f4f5f7",surface:"#ffffff",surface2:"#eceef2",text:"#15171a",muted:"#686d75",border:"#d9dce1",accent:"#2f6fed",accentText:"#ffffff"},
customCss:"",
customCssEnabled:false,
wallpaper:null,
wallpaperEnabled:false,
wallpaperDim:.25,
music:null,
musicEnabled:false,
musicVolume:.18,
musicLoop:true,
historyEnabled:true,
historyLimit:100,
resultMode:"infinite",
safeSearch:"normal",
mode:"default",
customModes:[],
ai:{enabled:false,provider:"openai",baseUrl:"https://api.openai.com/v1/chat/completions",apiKey:"",model:""},
easterEggs:true,
homepageLayout:[
{id:"quote",type:"quote",span:12,visible:true},
{id:"weather",type:"weather",span:6,visible:true},
{id:"stocks",type:"stocks",span:6,visible:true}
],
resultsLayout:{showScores:true,showDescriptions:true,showUrls:true,compact:false},
widgetScripts:[]
};

let settings=null;
let db=null;
let state={
page:"home",
query:"",
tab:"web",
pageNumber:1,
limit:20,
results:[],
loading:false,
hasMore:true,
searchToken:0,
weather:null,
stocks:[],
audio:null,
easterEggBuffer:""
};

const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const clone=o=>JSON.parse(JSON.stringify(o));

function openDB(){
return new Promise((resolve,reject)=>{
const req=indexedDB.open(DB_NAME,DB_VERSION);
req.onupgradeneeded=()=>{
const d=req.result;
["settings","history","themes","layouts","modes","widgets","customCss","fonts","ai","media"].forEach(name=>{
if(!d.objectStoreNames.contains(name)) d.createObjectStore(name,{keyPath:"id"});
});
};
req.onsuccess=()=>resolve(req.result);
req.onerror=()=>reject(req.error);
});
}

function dbGet(store,id){
return new Promise((resolve,reject)=>{
const tx=db.transaction(store,"readonly");
const req=tx.objectStore(store).get(id);
req.onsuccess=()=>resolve(req.result||null);
req.onerror=()=>reject(req.error);
});
}

function dbPut(store,value){
return new Promise((resolve,reject)=>{
const tx=db.transaction(store,"readwrite");
tx.objectStore(store).put(value);
tx.oncomplete=()=>resolve(value);
tx.onerror=()=>reject(tx.error);
});
}

function dbDelete(store,id){
return new Promise((resolve,reject)=>{
const tx=db.transaction(store,"readwrite");
tx.objectStore(store).delete(id);
tx.oncomplete=()=>resolve();
tx.onerror=()=>reject(tx.error);
});
}

function dbAll(store){
return new Promise((resolve,reject)=>{
const tx=db.transaction(store,"readonly");
const req=tx.objectStore(store).getAll();
req.onsuccess=()=>resolve(req.result||[]);
req.onerror=()=>reject(req.error);
});
}

async function loadSettings(){
const saved=await dbGet("settings","main");
settings=merge(DEFAULT_SETTINGS,saved?.value||{});
await dbPut("settings",{id:"main",value:settings});
}

function merge(base,extra){
const out=clone(base);
for(const [k,v] of Object.entries(extra||{})){
if(v&&typeof v==="object"&&!Array.isArray(v)&&out[k]&&typeof out[k]==="object"&&!Array.isArray(out[k])) out[k]=merge(out[k],v);
else out[k]=v;
}
return out;
}

async function saveSettings(){
await dbPut("settings",{id:"main",value:settings});
applySettings();
}

function applySettings(){
const root=document.documentElement;
root.style.setProperty("--font",settings.font);
for(const [k,v] of Object.entries(settings.colors)) root.style.setProperty("--"+camelToKebab(k),v);
root.style.setProperty("--wallpaper-opacity",settings.wallpaperEnabled&&settings.wallpaper?String(1-settings.wallpaperDim):"0");
root.style.setProperty("--wallpaper-overlay",settings.wallpaperEnabled&&settings.wallpaper?`rgba(0,0,0,${settings.wallpaperDim})`:"transparent");
const wallpaper=$("#wallpaper");
if(settings.wallpaperEnabled&&settings.wallpaper){
wallpaper.style.backgroundImage=`url(${settings.wallpaper.url})`;
}else wallpaper.style.backgroundImage="none";
applyTheme();
applyCustomCss();
renderHomeWidgets();
}

function camelToKebab(s){return s.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}

function applyTheme(){
if(settings.theme==="dark"){
document.documentElement.style.colorScheme="dark";
if(settings.colors.bg==="#f4f5f7") setDarkColors();
}else if(settings.theme==="light"){
document.documentElement.style.colorScheme="light";
}else{
const dark=matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.style.colorScheme=dark?"dark":"light";
if(settings.colors.bg==="#f4f5f7"&&dark) setDarkColors();
}
}

function setDarkColors(){
const root=document.documentElement;
root.style.setProperty("--bg","#101216");
root.style.setProperty("--surface","#181b21");
root.style.setProperty("--surface-2","#22262d");
root.style.setProperty("--text","#f2f4f7");
root.style.setProperty("--muted","#a5abb5");
root.style.setProperty("--border","#303640");
root.style.setProperty("--accent","#78a6ff");
root.style.setProperty("--accent-text","#0b1220");
}

function applyCustomCss(){
let node=$("#customCssNode");
if(!node){
node=document.createElement("style");
node.id="customCssNode";
document.head.appendChild(node);
}
node.textContent=settings.customCssEnabled?settings.customCss:"";
}

function toast(text){
const el=$("#toast");
el.textContent=text;
el.classList.remove("hidden");
clearTimeout(toast.timer);
toast.timer=setTimeout(()=>el.classList.add("hidden"),2600);
}

function showPage(page){
state.page=page;
$("#homePage").classList.toggle("hidden",page!=="home");
$("#resultsPage").classList.toggle("hidden",page!=="results");
if(page==="home") location.hash="home";
}

async function search(query,reset=true){
query=query.trim();
if(!query)return;
if(reset){
state.pageNumber=1;
state.results=[];
state.hasMore=true;
}
state.query=query;
state.loading=true;
state.searchToken++;
const token=state.searchToken;
showPage("results");
$("#resultsSearchInput").value=query;
renderResults();
try{
const url=new URL(API_URL+"/search");
url.searchParams.set("q",query);
url.searchParams.set("page",String(state.pageNumber));
url.searchParams.set("limit",String(state.limit));
const response=await fetch(url,{headers:{Accept:"application/json"}});
if(!response.ok)throw new Error("Search request failed");
const data=await response.json();
if(token!==state.searchToken)return;
let incoming=Array.isArray(data.results)?data.results:[];
incoming=applyMode(incoming);
if(reset)state.results=incoming;
else state.results=[...state.results,...incoming];
state.hasMore=incoming.length>=state.limit;
if(settings.historyEnabled&&reset)await addHistory(query);
}catch(error){
if(token===state.searchToken) toast(error.message||"Search failed");
}finally{
if(token===state.searchToken){
state.loading=false;
renderResults();
}
}
}

async function loadMore(){
if(state.loading||!state.hasMore||!state.query)return;
state.pageNumber++;
await search(state.query,false);
}

function applyMode(results){
if(settings.mode==="default")return results;
const mode=settings.customModes.find(m=>m.id===settings.mode);
if(!mode)return results;
const keywords=(mode.keywords||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);
const domains=(mode.domains||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);
return [...results].map(r=>{
let bonus=0;
const hay=(r.title+" "+r.description+" "+r.url).toLowerCase();
keywords.forEach(k=>{if(k&&hay.includes(k))bonus+=mode.keywordWeight||5});
domains.forEach(d=>{try{if(new URL(r.url).hostname.toLowerCase().includes(d))bonus+=mode.domainWeight||8}catch{}});
if(mode.freshness&&/202[5-9]|2030/.test(hay))bonus+=mode.freshness;
if(mode.technical&&/(api|documentation|developer|github|programming|software|technical)/.test(hay))bonus+=mode.technical;
return {...r,_modeScore:(Number(r.score)||0)+bonus};
}).sort((a,b)=>(b._modeScore||0)-(a._modeScore||0));
}

function renderResults(){
const list=$("#resultsList");
if(!state.query){
list.innerHTML='<div class="empty">Start a search.</div>';
return;
}
const filtered=filterResults(state.results);
$("#resultsMeta").textContent=`${state.query} · ${filtered.length} loaded${settings.mode!=="default"?" · mode: "+getModeName():""}`;
if(!filtered.length){
list.innerHTML=state.loading?'<div class="empty">Searching...</div>':'<div class="empty">No results for this tab.</div>';
return;
}
list.innerHTML=filtered.map(renderResultCard).join("");
if(state.loading)list.insertAdjacentHTML("beforeend",'<div class="empty">Loading...</div>');
else if(state.hasMore&&settings.resultMode==="loadmore")list.insertAdjacentHTML("beforeend",'<div class="settings-actions" style="justify-content:center"><button id="loadMoreButton" class="primary">Load more</button></div>');
else if(state.hasMore&&settings.resultMode==="pages")list.insertAdjacentHTML("beforeend",'<div class="settings-actions" style="justify-content:center"><button id="nextPageButton" class="primary">Next page</button></div>');
const loadMoreButton=$("#loadMoreButton"); if(loadMoreButton)loadMoreButton.onclick=loadMore;
const nextPageButton=$("#nextPageButton"); if(nextPageButton)nextPageButton.onclick=loadMore;
}

function filterResults(results){
if(state.tab==="web")return results;
if(state.tab==="images")return results.filter(r=>Array.isArray(r.images)&&r.images.length);
if(state.tab==="videos")return results.filter(r=>Array.isArray(r.videos)&&r.videos.length);
if(state.tab==="news")return results.filter(r=>/news|bbc|reuters|apnews|cnn|guardian|nytimes|washingtonpost/i.test(r.url+" "+r.title+" "+r.description));
return results;
}

function renderResultCard(r){
const title=escapeHtml(r.title||r.url||"Untitled");
const url=escapeHtml(r.url||"");
const desc=escapeHtml(r.description||"");
const score=settings.resultsLayout.showScores?`<div class="result-score">Score ${Number(r._modeScore??r.score??0).toFixed(3)}</div>`:"";
const description=settings.resultsLayout.showDescriptions&&desc?`<div class="result-description">${desc}</div>`:"";
const shownUrl=settings.resultsLayout.showUrls?`<div class="result-url">${url}</div>`:"";
const media=state.tab==="images"?renderImages(r):state.tab==="videos"?renderVideos(r):renderMediaPreview(r);
return `<article class="result-card ${settings.resultsLayout.compact?"compact":""}">
<a class="result-title" href="${escapeAttr(r.url||"#")}" target="_blank" rel="noopener noreferrer">${title}</a>
${shownUrl}${description}${score}${media}</article>`;
}

function renderMediaPreview(r){
if(!r.images?.length&&!r.videos?.length)return"";
return `<div class="result-media-strip">${renderImages(r,3)}${renderVideos(r,3)}</div>`;
}

function renderImages(r,max=99){
return (r.images||[]).slice(0,max).map((img,i)=>{
const src=img?.url;
if(!src)return"";
const alt=escapeHtml(img.alt||img.title||"Image");
return `<div class="media-card"><button type="button" class="image-open" data-result-id="${r.id}" data-index="${i}"><img src="${escapeAttr(src)}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer"><div class="media-body">${alt}</div></button></div>`;
}).join("");
}

function renderVideos(r,max=99){
return (r.videos||[]).slice(0,max).map((video,i)=>{
const thumb=video?.thumbnail;
const body=video?.title||"Open video";
return `<div class="media-card"><button type="button" class="video-open" data-result-id="${r.id}" data-index="${i}">${thumb?`<img src="${escapeAttr(thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'<div class="video-placeholder">Video</div>'}<div class="media-body">${escapeHtml(body)}</div></button></div>`;
}).join("");
}

function openImage(resultId,index){
const result=state.results.find(r=>String(r.id)===String(resultId));
const image=result?.images?.[index];
if(!image?.url)return;
const root=$("#modalRoot");
root.innerHTML=`<div class="modal-backdrop" data-close-modal><div class="modal"><div class="modal-header"><h2>Image</h2><button type="button" data-close-modal>Close</button></div><div class="modal-body"><img src="${escapeAttr(image.url)}" alt="${escapeAttr(image.alt||image.title||"Image")}" style="display:block;width:100%;max-height:65vh;object-fit:contain;border-radius:12px;background:var(--surface-2)" referrerpolicy="no-referrer"><p>${escapeHtml(image.alt||image.title||"")}</p><div class="settings-actions"><a class="icon-button" href="${escapeAttr(image.url)}" target="_blank" rel="noopener noreferrer">View image</a><a class="icon-button" href="${escapeAttr(image.url)}" download>Download</a><a class="icon-button" href="${escapeAttr(result.url)}" target="_blank" rel="noopener noreferrer">Source page</a></div></div></div></div>`;
}

function openVideo(resultId,index){
const result=state.results.find(r=>String(r.id)===String(resultId));
const video=result?.videos?.[index];
if(video?.url)window.open(video.url,"_blank","noopener,noreferrer");
}

async function addHistory(query){
const item={id:crypto.randomUUID(),query,createdAt:Date.now()};
await dbPut("history",item);
const all=(await dbAll("history")).sort((a,b)=>b.createdAt-a.createdAt);
for(const old of all.slice(settings.historyLimit))await dbDelete("history",old.id);
}

async function getHistory(){
return (await dbAll("history")).sort((a,b)=>b.createdAt-a.createdAt);
}

function getModeName(){
if(settings.mode==="default")return"Default";
return settings.customModes.find(m=>m.id===settings.mode)?.name||"Default";
}

async function renderHomeWidgets(){
const container=$("#homeWidgets");
if(!container)return;
const layouts=settings.homepageLayout.filter(x=>x.visible!==false);
container.innerHTML=layouts.map(renderWidgetByLayout).join("");
await loadWeatherWidget();
await loadStocksWidget();
renderAllCustomWidgets();
}

function renderWidgetByLayout(item){
if(item.type==="quote")return `<section class="widget span-${item.span||12}" data-widget-id="${item.id}"><div class="widget-title">Quote</div><div id="quoteWidget"></div><div class="widget-actions"><button type="button" data-refresh-quote>Refresh</button></div></section>`;
if(item.type==="weather")return `<section class="widget span-${item.span||6}" data-widget-id="${item.id}"><div class="widget-title">Weather</div><div id="weatherWidget"><div class="drop-zone">Add a location in Settings.</div></div></section>`;
if(item.type==="stocks")return `<section class="widget span-${item.span||6}" data-widget-id="${item.id}"><div class="widget-title">Stocks</div><div id="stocksWidget"><div class="drop-zone">Add symbols in Settings.</div></div></section>`;
if(item.type==="custom")return `<section class="widget span-${item.span||6}" data-widget-id="${item.id}"><div id="customWidget-${escapeAttr(item.widgetId)}"></div></section>`;
return"";
}

function renderQuote(){
const quote=QUOTES[Math.floor(Math.random()*QUOTES.length)];
const el=$("#quoteWidget");
if(el)el.innerHTML=`<div class="quote-text">“${escapeHtml(quote.t)}”</div><div class="quote-source">${escapeHtml(quote.a)}</div>`;
}

async function loadWeatherWidget(){
const el=$("#weatherWidget");
if(!el)return;
if(!settings.weatherLocation){el.innerHTML='<div class="drop-zone">Add a location in Settings.</div>';return}
try{
const loc=settings.weatherLocation;
const url=new URL("https://api.open-meteo.com/v1/forecast");
url.searchParams.set("latitude",loc.latitude);
url.searchParams.set("longitude",loc.longitude);
url.searchParams.set("current","temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m");
url.searchParams.set("timezone","auto");
const data=await fetch(url).then(r=>r.json());
el.innerHTML=`<div><strong>${escapeHtml(loc.name)}</strong></div><div style="font-size:30px;margin-top:8px">${Math.round(data.current?.temperature_2m??0)}°</div><div class="quote-source">Humidity ${Math.round(data.current?.relative_humidity_2m??0)}% · Wind ${Math.round(data.current?.wind_speed_10m??0)} km/h</div>`;
}catch{el.innerHTML='<div class="drop-zone">Weather unavailable.</div>'}
}

async function loadStocksWidget(){
const el=$("#stocksWidget");
if(!el)return;
const symbols=settings.stockSymbols||[];
if(!settings.stockApiKey||!symbols.length){el.innerHTML='<div class="drop-zone">Configure a stock provider and symbols in Settings.</div>';return}
if(settings.stockProvider!=="alphavantage"){el.innerHTML='<div class="drop-zone">This provider is configured for future expansion.</div>';return}
const rows=[];
for(const symbol of symbols.slice(0,6)){
try{
const u=new URL("https://www.alphavantage.co/query");
u.searchParams.set("function","GLOBAL_QUOTE");
u.searchParams.set("symbol",symbol);
u.searchParams.set("apikey",settings.stockApiKey);
const data=await fetch(u).then(r=>r.json());
const q=data["Global Quote"]||{};
rows.push(`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)"><span>${escapeHtml(symbol)}</span><strong>${escapeHtml(q["05. price"]||"Unavailable")}</strong></div>`);
}catch{rows.push(`<div>${escapeHtml(symbol)} unavailable</div>`)}
}
el.innerHTML=rows.join("");
}

function openSettings(){
$("#settingsContent").innerHTML=renderSettings();
$("#settingsPanel").classList.remove("hidden");
}

function renderSettings(){
return `
<section class="settings-section"><h3>Appearance</h3>
<div class="settings-row"><label>Theme</label><select id="setTheme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
<div class="settings-actions"><button id="customThemeButton">Custom theme</button><button id="fontButton">Font</button><button id="wallpaperButton">Wallpaper</button><button id="musicButton">Background music</button></div>
</section>
<section class="settings-section"><h3>Results loading</h3><div class="settings-row"><label>Loading mode</label><select id="resultMode"><option value="infinite">Infinite scroll</option><option value="loadmore">Load more</option><option value="pages">Page-wise</option></select></div></section><section class="settings-section"><h3>Storage</h3>
<div class="settings-row"><label>Save local history</label><input id="historyEnabled" type="checkbox"></div>
<div class="settings-row"><label>History limit</label><input id="historyLimit" type="number" min="10" max="1000"></div>
<div class="settings-actions"><button id="historyButton">View history</button><button id="clearHistoryButton" class="danger">Clear history</button></div>
</section>
<section class="settings-section"><h3>Safe Search</h3>
<select id="safeSearch"><option value="extreme">Extreme</option><option value="normal">Normal</option><option value="minimal">Minimal</option><option value="truth">Truth</option></select>
<p class="quote-source">Truth minimizes content filtering. Third-party results can be inaccurate, unsuitable, or disturbing.</p>
</section>
<section class="settings-section"><h3>Weather</h3>
<div class="settings-row"><label>Location</label><input id="weatherLocationName" type="text" value="${escapeAttr(settings.weatherLocation?.name||"")}" placeholder="City"></div>
<div class="settings-actions"><button id="weatherFindButton">Find location</button><button id="weatherUseLocationButton">Use my location</button></div>
</section>
<section class="settings-section"><h3>Stocks</h3>
<div class="settings-row"><label>Provider</label><select id="stockProvider"><option value="alphavantage">Alpha Vantage</option></select></div>
<div class="settings-row"><label>API key</label><input id="stockApiKey" type="password" value="${escapeAttr(settings.stockApiKey||"")}"></div>
<div class="settings-row"><label>Symbols</label><input id="stockSymbols" type="text" value="${escapeAttr((settings.stockSymbols||[]).join(", "))}" placeholder="AAPL, MSFT"></div>
<div class="settings-actions"><button id="saveStocks" class="primary">Save stocks</button></div>
</section>
<section class="settings-section"><h3>Modes</h3>
<div class="settings-row"><label>Active mode</label><select id="activeMode"></select></div>
<div class="settings-actions"><button id="createModeButton" class="primary">Create mode</button><button id="tutorialModeButton">How modes work</button><button id="manageModesButton">Manage modes</button></div>
</section>
<section class="settings-section"><h3>Widgets</h3>
<div class="settings-actions"><button id="widgetCreatorButton" class="primary">Widget creator</button><button id="scriptWidgetButton">Import script.js</button><button id="manageWidgetsButton">Manage widgets</button></div>
</section>
<section class="settings-section"><h3>UI</h3>
<div class="settings-actions"><button id="homepageEditorButton" class="primary">Edit homepage</button><button id="resultsEditorButton">Edit results page</button><button id="customCssButton">Custom CSS</button></div>
</section>
<section class="settings-section"><h3>AI</h3>
<div class="settings-row"><label>Enable AI</label><input id="aiEnabled" type="checkbox"></div>
<div class="settings-row"><label>Provider</label><input id="aiProvider" type="text"></div>
<div class="settings-row"><label>Endpoint</label><input id="aiBaseUrl" type="url"></div>
<div class="settings-row"><label>Model</label><input id="aiModel" type="text"></div>
<div class="settings-row"><label>API key</label><input id="aiApiKey" type="password"></div>
<div class="settings-actions"><button id="saveAiButton">Save AI settings</button></div>
</section>
<section class="settings-section"><h3>Easter eggs</h3>
<div class="settings-row"><label>Enable Easter eggs</label><input id="easterEggs" type="checkbox"></div>
</section>
<section class="settings-section"><h3>Backup</h3>
<div class="settings-actions"><button id="exportButton">Export settings</button><button id="importButton">Import settings</button><input id="importInput" type="file" accept=".json" class="hidden"></div>
</section>`;
}

async function bindSettings(){
$("#setTheme").value=settings.theme;
$("#historyEnabled").checked=settings.historyEnabled;
$("#resultMode").value=settings.resultMode;
$("#historyLimit").value=settings.historyLimit;
$("#safeSearch").value=settings.safeSearch;
$("#easterEggs").checked=settings.easterEggs;
const modeSelect=$("#activeMode");
modeSelect.innerHTML=`<option value="default">Default</option>`+settings.customModes.map(m=>`<option value="${escapeAttr(m.id)}">${escapeHtml(m.name)}</option>`).join("");
modeSelect.value=settings.mode;
$("#aiEnabled").checked=settings.ai.enabled;
$("#aiProvider").value=settings.ai.provider;
$("#aiBaseUrl").value=settings.ai.baseUrl;
$("#aiModel").value=settings.ai.model;
$("#aiApiKey").value=settings.ai.apiKey;
$("#setTheme").onchange=async e=>{settings.theme=e.target.value;await saveSettings()};
$("#historyEnabled").onchange=async e=>{settings.historyEnabled=e.target.checked;await saveSettings()}; $("#resultMode").onchange=async e=>{settings.resultMode=e.target.value;await saveSettings()};
$("#historyLimit").onchange=async e=>{settings.historyLimit=Math.max(10,Math.min(1000,Number(e.target.value)||100));await saveSettings()};
$("#safeSearch").onchange=async e=>{settings.safeSearch=e.target.value;await saveSettings()};
$("#stockProvider").value=settings.stockProvider||"alphavantage";
$("#weatherFindButton").onclick=async()=>{
const q=$("#weatherLocationName").value.trim();
if(!q)return;
const u=new URL("https://geocoding-api.open-meteo.com/v1/search");
u.searchParams.set("name",q);u.searchParams.set("count","5");u.searchParams.set("language","en");u.searchParams.set("format","json");
try{
const data=await fetch(u).then(r=>r.json());
const places=data.results||[];
if(!places.length){toast("Location not found");return}
openModal("Choose location",places.map((p,i)=>`<button data-location-index="${i}" style="display:block;width:100%;text-align:left;margin:7px 0;border:1px solid var(--border);background:var(--surface);color:var(--text);padding:10px;border-radius:9px">${escapeHtml(p.name)}, ${escapeHtml(p.country||"")}</button>`).join(""));
$$("[data-location-index]").forEach(b=>b.onclick=async()=>{const p=places[Number(b.dataset.locationIndex)];settings.weatherLocation={name:p.name+", "+(p.country||""),latitude:p.latitude,longitude:p.longitude};await saveSettings();closeModal();openSettings()});
}catch{toast("Location lookup failed")}
};
$("#weatherUseLocationButton").onclick=()=>navigator.geolocation.getCurrentPosition(async pos=>{
const {latitude,longitude}=pos.coords;
settings.weatherLocation={name:"Current location",latitude,longitude};
await saveSettings();openSettings();
},()=>toast("Location permission was not granted"));
$("#saveStocks").onclick=async()=>{
settings.stockProvider=$("#stockProvider").value;
settings.stockApiKey=$("#stockApiKey").value.trim();
settings.stockSymbols=$("#stockSymbols").value.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
await saveSettings();toast("Stocks saved");
};
$("#easterEggs").onchange=async e=>{settings.easterEggs=e.target.checked;await saveSettings()};
modeSelect.onchange=async e=>{settings.mode=e.target.value;await saveSettings();renderResults()};
$("#customThemeButton").onclick=()=>openCustomTheme();
$("#fontButton").onclick=()=>openFontSettings();
$("#wallpaperButton").onclick=()=>openWallpaperSettings();
$("#musicButton").onclick=()=>openMusicSettings();
$("#historyButton").onclick=()=>openHistory();
$("#clearHistoryButton").onclick=clearHistory;
$("#createModeButton").onclick=()=>openModeEditor();
$("#tutorialModeButton").onclick=openModeTutorial;
$("#manageModesButton").onclick=openModesManager;
$("#widgetCreatorButton").onclick=()=>openWidgetCreator();
$("#scriptWidgetButton").onclick=importWidgetScript;
$("#manageWidgetsButton").onclick=openWidgetsManager;
$("#homepageEditorButton").onclick=()=>openLayoutEditor("home");
$("#resultsEditorButton").onclick=()=>openResultsEditor();
$("#customCssButton").onclick=()=>openCssEditor();
$("#saveAiButton").onclick=async()=>{
settings.ai={enabled:$("#aiEnabled").checked,provider:$("#aiProvider").value.trim(),baseUrl:$("#aiBaseUrl").value.trim(),model:$("#aiModel").value.trim(),apiKey:$("#aiApiKey").value};
await saveSettings();toast("AI settings saved");
};
$("#exportButton").onclick=exportSettings;
$("#importButton").onclick=()=>$("#importInput").click();
$("#importInput").onchange=importSettings;
}

function openModal(title,body){
const root=$("#modalRoot");
root.innerHTML=`<div class="modal-backdrop" data-close-modal><div class="modal"><div class="modal-header"><h2>${title}</h2><button type="button" data-close-modal>Close</button></div><div class="modal-body">${body}</div></div></div>`;
}

function closeModal(){$("#modalRoot").innerHTML=""}

function openCustomTheme(){
openModal("Custom theme",`<div class="color-grid" id="colorGrid">${Object.entries(settings.colors).map(([k,v])=>`<label>${escapeHtml(k)}<input data-color="${k}" type="color" value="${escapeAttr(v)}"></label>`).join("")}</div><div class="settings-actions"><button id="saveTheme" class="primary">Save theme</button></div>`);
$("#saveTheme").onclick=async()=>{ $$("[data-color]").forEach(i=>settings.colors[i.dataset.color]=i.value);settings.theme="light";await saveSettings();closeModal();toast("Theme saved")};
}

function openFontSettings(){

openModal("Font",`<label style="display:grid;gap:8px">CSS font stack<input id="fontValue" type="text" value="${escapeAttr(settings.font)}"></label><div class="settings-actions"><button id="saveFont" class="primary">Save font</button><button id="importFont">Import font</button></div>`);
$("#saveFont").onclick=async()=>{settings.font=$("#fontValue").value.trim()||DEFAULT_SETTINGS.font;await saveSettings();closeModal()}; $("#importFont").onclick=openFontFile;
}

function openWallpaperSettings(){
openModal("Wallpaper",`<div class="drop-zone"><input id="wallpaperFile" type="file" accept="image/*"></div><div class="settings-row"><label>Enable wallpaper</label><input id="wallpaperEnabled" type="checkbox" ${settings.wallpaperEnabled?"checked":""}></div><label style="display:grid;gap:8px">Dimming<input id="wallpaperDim" type="range" min="0" max="0.9" step="0.05" value="${settings.wallpaperDim}"></label><div class="settings-actions"><button id="saveWallpaper" class="primary">Save wallpaper</button><button id="removeWallpaper" class="danger">Remove wallpaper</button></div>`);
$("#saveWallpaper").onclick=async()=>{
const file=$("#wallpaperFile").files[0];
if(file){
const dataUrl=await fileToDataUrl(file);
settings.wallpaper={name:file.name,type:file.type,url:dataUrl};
}
settings.wallpaperEnabled=$("#wallpaperEnabled").checked;
settings.wallpaperDim=Number($("#wallpaperDim").value);
await saveSettings();closeModal();
};
$("#removeWallpaper").onclick=async()=>{settings.wallpaper=null;settings.wallpaperEnabled=false;await saveSettings();closeModal()};
}

function openMusicSettings(){
openModal("Background music",`<div class="drop-zone"><input id="musicFile" type="file" accept="audio/*"></div><div class="settings-row"><label>Enable music</label><input id="musicEnabled" type="checkbox" ${settings.musicEnabled?"checked":""}></div><label style="display:grid;gap:8px">Volume<input id="musicVolume" type="range" min="0" max="1" step="0.01" value="${settings.musicVolume}"></label><div class="settings-row"><label>Loop</label><input id="musicLoop" type="checkbox" ${settings.musicLoop?"checked":""}></div><p class="quote-source">Browsers may block automatic audio until the user interacts with the page.</p><div class="settings-actions"><button id="saveMusic" class="primary">Save music</button><button id="removeMusic" class="danger">Remove music</button></div>`);
$("#saveMusic").onclick=async()=>{
const file=$("#musicFile").files[0];
if(file){
const dataUrl=await fileToDataUrl(file);
settings.music={name:file.name,type:file.type,url:dataUrl};
}
settings.musicEnabled=$("#musicEnabled").checked;
settings.musicVolume=Number($("#musicVolume").value);
settings.musicLoop=$("#musicLoop").checked;
await saveSettings();closeModal();setupMusic();toast("Music saved");
};
$("#removeMusic").onclick=async()=>{settings.music=null;settings.musicEnabled=false;await saveSettings();closeModal();setupMusic()};
}

function setupMusic(){
if(state.audio){state.audio.pause();state.audio.remove();state.audio=null}
if(!settings.musicEnabled||!settings.music)return;
const audio=new Audio(settings.music.url);
audio.loop=settings.musicLoop;
audio.volume=settings.musicVolume;
audio.preload="auto";
audio.id="backgroundMusic";
document.body.appendChild(audio);
state.audio=audio;
const start=()=>{audio.play().catch(()=>{})};
document.addEventListener("pointerdown",start,{once:true});
document.addEventListener("keydown",start,{once:true});
}

async function openHistory(){
const items=await getHistory();
openModal("Local history",items.length?`<div>${items.map(x=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)"><button type="button" data-history-query="${escapeAttr(x.query)}" style="border:0;background:none;text-align:left;color:inherit">${escapeHtml(x.query)}</button><small>${new Date(x.createdAt).toLocaleString()}</small></div>`).join("")}</div>`:'<div class="empty">No history.</div>');
$$("[data-history-query]").forEach(b=>b.onclick=()=>{closeModal();search(b.dataset.historyQuery)});
}

async function clearHistory(){
for(const item of await dbAll("history"))await dbDelete("history",item.id);
toast("History cleared");
}

function openModeTutorial(){
openModal("How modes work",`<div class="empty" style="text-align:left"><strong>1. Truth25 creates the base order.</strong><p>Your mode never changes the index.</p><strong>2. Your preferences add local bonuses.</strong><p>Keywords, domains, freshness and technical signals can increase a result's local score.</p><strong>3. The browser sorts the loaded results.</strong><p>The mode is private to this browser and is not sent to the backend.</p><strong>4. Modes work best with matching search results.</strong><p>A small index or a query with no matching keywords can make a mode appear to do very little.</p></div>`);
}

function openModeEditor(existing=null){
const m=existing||{id:crypto.randomUUID(),name:"",keywords:"",domains:"",keywordWeight:5,domainWeight:8,freshness:2,technical:3};
openModal(existing?"Edit mode":"Create mode",`<div class="field-grid">
<label>Name<input id="modeName" value="${escapeAttr(m.name)}"></label>
<label>Keywords<input id="modeKeywords" value="${escapeAttr(m.keywords)}" placeholder="ai, software, programming"></label>
<label>Preferred domains<input id="modeDomains" value="${escapeAttr(m.domains)}" placeholder="github.com, developer.mozilla.org"></label>
<label>Keyword bonus<input id="modeKeywordWeight" type="number" value="${m.keywordWeight}"></label>
<label>Domain bonus<input id="modeDomainWeight" type="number" value="${m.domainWeight}"></label>
<label>Freshness bonus<input id="modeFreshness" type="number" value="${m.freshness}"></label>
<label>Technical bonus<input id="modeTechnical" type="number" value="${m.technical}"></label>
</div><div class="settings-actions"><button id="saveMode" class="primary">Save mode</button></div>`);
$("#saveMode").onclick=async()=>{
m.name=$("#modeName").value.trim()||"Untitled mode";
m.keywords=$("#modeKeywords").value;
m.domains=$("#modeDomains").value;
m.keywordWeight=Number($("#modeKeywordWeight").value)||0;
m.domainWeight=Number($("#modeDomainWeight").value)||0;
m.freshness=Number($("#modeFreshness").value)||0;
m.technical=Number($("#modeTechnical").value)||0;
const index=settings.customModes.findIndex(x=>x.id===m.id);
if(index>=0)settings.customModes[index]=m;else settings.customModes.push(m);
settings.mode=m.id;
await dbPut("modes",{id:m.id,value:m});
await saveSettings();closeModal();openSettings();toast("Mode saved");
};
}

function openModesManager(){
openModal("Modes",`${settings.customModes.length?settings.customModes.map(m=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)"><span>${escapeHtml(m.name)}</span><span><button data-edit-mode="${m.id}">Edit</button> <button class="danger" data-delete-mode="${m.id}">Delete</button></span></div>`).join(""):'<div class="empty">No custom modes.</div>'}`);
$$("[data-edit-mode]").forEach(b=>b.onclick=()=>{const m=settings.customModes.find(x=>x.id===b.dataset.editMode);openModeEditor(m)});
$$("[data-delete-mode]").forEach(b=>b.onclick=async()=>{settings.customModes=settings.customModes.filter(x=>x.id!==b.dataset.deleteMode);if(settings.mode===b.dataset.deleteMode)settings.mode="default";await saveSettings();openModesManager()});
}

function openWidgetCreator(){
const widget={id:crypto.randomUUID(),name:"",title:"",text:"",span:6,html:"",css:""};
openModal("Widget creator",`<div class="field-grid"><label>Name<input id="widgetName"></label><label>Title<input id="widgetTitle"></label><label>Width<select id="widgetSpan"><option value="3">25%</option><option value="4">33%</option><option value="6" selected>50%</option><option value="8">67%</option><option value="12">100%</option></select></label><label>Text<input id="widgetText"></label></div><label style="display:grid;gap:6px;margin-top:12px">HTML<textarea id="widgetHtml" placeholder="Optional HTML"></textarea></label><label style="display:grid;gap:6px;margin-top:12px">CSS<textarea id="widgetCss" placeholder="Optional CSS"></textarea></label><div class="settings-actions"><button id="saveWidget" class="primary">Save widget</button></div>`);
$("#saveWidget").onclick=async()=>{
widget.name=$("#widgetName").value.trim()||"Widget";
widget.title=$("#widgetTitle").value;
widget.text=$("#widgetText").value;
widget.span=Number($("#widgetSpan").value);
widget.html=$("#widgetHtml").value;
widget.css=$("#widgetCss").value;
settings.widgetScripts.push(widget);
await dbPut("widgets",{id:widget.id,value:widget});
settings.homepageLayout.push({id:"widget-"+widget.id,type:"custom",widgetId:widget.id,span:widget.span,visible:true});
await saveSettings();closeModal();toast("Widget created");
};
}

function openWidgetsManager(){
openModal("Widgets",settings.widgetScripts.length?settings.widgetScripts.map(w=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)"><span>${escapeHtml(w.name)}</span><button class="danger" data-delete-widget="${w.id}">Delete</button></div>`).join(""):'<div class="empty">No custom widgets.</div>');
$$("[data-delete-widget]").forEach(b=>b.onclick=async()=>{settings.widgetScripts=settings.widgetScripts.filter(w=>w.id!==b.dataset.deleteWidget);settings.homepageLayout=settings.homepageLayout.filter(x=>x.widgetId!==b.dataset.deleteWidget);await saveSettings();openWidgetsManager()});
}

async function importWidgetScript(){
const input=document.createElement("input");
input.type="file";
input.accept=".js,text/javascript,application/javascript";
input.onchange=async()=>{
const file=input.files[0];
if(!file)return;
const script=await file.text();
const widget={id:crypto.randomUUID(),name:file.name,title:file.name,text:"",span:6,html:"",css:"",script};
settings.widgetScripts.push(widget);
await dbPut("widgets",{id:widget.id,value:widget});
settings.homepageLayout.push({id:"widget-"+widget.id,type:"script",widgetId:widget.id,span:6,visible:true});
await saveSettings();
toast("Script widget imported");
};
input.click();
}

function renderCustomWidget(widgetId,targetId){
const w=settings.widgetScripts.find(x=>x.id===widgetId);
const target=document.getElementById(targetId);
if(!w||!target)return;
target.innerHTML=`<div class="widget-title">${escapeHtml(w.title||w.name)}</div>${w.text?`<div>${escapeHtml(w.text)}</div>`:""}${w.html||""}`;
if(w.css){
const style=document.createElement("style");
style.textContent=w.css;
target.appendChild(style);
}
if(w.script){
try{
const fn=new Function("element","SEErch",w.script);
fn(target,{version:"1",storage:{get:dbGet,put:dbPut},toast});
}catch(error){target.insertAdjacentHTML("beforeend",`<div class="quote-source">Widget error: ${escapeHtml(error.message)}</div>`)}
}
}

function renderAllCustomWidgets(){
settings.widgetScripts.forEach(w=>{
const targetId=`customWidget-${w.id}`;
if(document.getElementById(targetId))renderCustomWidget(w.id,targetId);
});
}

function openLayoutEditor(kind){
if(kind==="home")openHomeEditor();else openResultsEditor();
}

function openHomeEditor(){
openModal("Homepage editor",`<div class="editor-canvas" id="homeEditorCanvas">${settings.homepageLayout.map((item,i)=>`<div class="editor-item" data-layout-index="${i}"><div class="editor-item-toolbar"><strong>${escapeHtml(item.type)}</strong><span><button data-up="${i}">Up</button><button data-down="${i}">Down</button><button data-remove="${i}">Remove</button></span></div><div class="field-grid"><label>Width<select data-span="${i}"><option value="3">25%</option><option value="4">33%</option><option value="6">50%</option><option value="8">67%</option><option value="12">100%</option></select></label><label>Visible<select data-visible="${i}"><option value="true">Visible</option><option value="false">Hidden</option></select></label></div></div>`).join("")}</div><div class="settings-actions"><button id="addHomeWidget">Add widget</button><button id="saveHomeLayout" class="primary">Save layout</button><button id="resetHomeLayout">Reset</button></div>`);
settings.homepageLayout.forEach((x,i)=>{const s=$(`[data-span="${i}"]`);if(s)s.value=x.span||6;const v=$(`[data-visible="${i}"]`);if(v)v.value=x.visible===false?"false":"true"});
$$("[data-up]").forEach(b=>b.onclick=()=>moveLayout(Number(b.dataset.up),-1));
$$("[data-down]").forEach(b=>b.onclick=()=>moveLayout(Number(b.dataset.down),1));
$$("[data-remove]").forEach(b=>b.onclick=()=>{settings.homepageLayout.splice(Number(b.dataset.remove),1);openHomeEditor()});
$$("[data-span]").forEach(s=>s.onchange=()=>settings.homepageLayout[Number(s.dataset.span)].span=Number(s.value));
$$("[data-visible]").forEach(s=>s.onchange=()=>settings.homepageLayout[Number(s.dataset.visible)].visible=s.value==="true");
$("#addHomeWidget").onclick=()=>openWidgetCreator();
$("#saveHomeLayout").onclick=async()=>{await saveSettings();closeModal();toast("Homepage saved")};
$("#resetHomeLayout").onclick=async()=>{settings.homepageLayout=clone(DEFAULT_SETTINGS.homepageLayout);await saveSettings();openHomeEditor()};
}

function moveLayout(index,delta){
const next=index+delta;
if(next<0||next>=settings.homepageLayout.length)return;
[settings.homepageLayout[index],settings.homepageLayout[next]]=[settings.homepageLayout[next],settings.homepageLayout[index]];
openHomeEditor();
}

function openResultsEditor(){
openModal("Results page editor",`<div class="settings-row"><label>Show scores</label><input id="resultShowScores" type="checkbox" ${settings.resultsLayout.showScores?"checked":""}></div><div class="settings-row"><label>Show descriptions</label><input id="resultShowDescriptions" type="checkbox" ${settings.resultsLayout.showDescriptions?"checked":""}></div><div class="settings-row"><label>Show URLs</label><input id="resultShowUrls" type="checkbox" ${settings.resultsLayout.showUrls?"checked":""}></div><div class="settings-row"><label>Compact results</label><input id="resultCompact" type="checkbox" ${settings.resultsLayout.compact?"checked":""}></div><div class="settings-actions"><button id="saveResultsLayout" class="primary">Save results layout</button></div>`);
$("#saveResultsLayout").onclick=async()=>{settings.resultsLayout={showScores:$("#resultShowScores").checked,showDescriptions:$("#resultShowDescriptions").checked,showUrls:$("#resultShowUrls").checked,compact:$("#resultCompact").checked};await saveSettings();closeModal();renderResults()};
}

function openCssEditor(){
openModal("Custom CSS",`<textarea id="customCssValue" style="min-height:360px;width:100%">${escapeHtml(settings.customCss)}</textarea><div class="settings-row"><label>Enable custom CSS</label><input id="customCssEnabled" type="checkbox" ${settings.customCssEnabled?"checked":""}></div><div class="settings-actions"><button id="saveCss" class="primary">Save CSS</button><button id="importCss">Import .css</button></div>`);
$("#saveCss").onclick=async()=>{settings.customCss=$("#customCssValue").value;settings.customCssEnabled=$("#customCssEnabled").checked;await saveSettings();closeModal()};
$("#importCss").onclick=()=>{const input=document.createElement("input");input.type="file";input.accept=".css,text/css";input.onchange=async()=>{$("#customCssValue").value=await input.files[0].text()};input.click()};
}

async function openFontFile(){
const input=document.createElement("input");
input.type="file";
input.accept=".woff,.woff2,.ttf,.otf";
input.onchange=async()=>{
const file=input.files[0];
if(!file)return;
const data=await file.arrayBuffer();
const id="font-"+crypto.randomUUID();
await dbPut("fonts",{id,name:file.name,type:file.type,data});
const url=URL.createObjectURL(new Blob([data],{type:file.type}));
const face=new FontFace("SEErchCustom",`url(${url})`);
await face.load();
document.fonts.add(face);
settings.font="SEErchCustom,system-ui,sans-serif";
await saveSettings();
toast("Font imported");
};
input.click();
}

function openFontSettingsOriginal(){
openFontSettings();
}

async function exportSettings(){
const data={settings,history:settings.historyEnabled?await getHistory():[],modes:settings.customModes,widgets:settings.widgetScripts};
const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
const url=URL.createObjectURL(blob);
const a=document.createElement("a");
a.href=url;a.download="seerchsq-settings.json";a.click();URL.revokeObjectURL(url);
}

async function importSettings(e){
const file=e.target.files[0];
if(!file)return;
try{
const data=JSON.parse(await file.text());
settings=merge(DEFAULT_SETTINGS,data.settings||{});
await saveSettings();
for(const h of data.history||[])await dbPut("history",h);
toast("Settings imported");
}catch{toast("Invalid settings file")}
e.target.value="";
}

function fileToDataUrl(file){
return new Promise((resolve,reject)=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result);
reader.onerror=()=>reject(reader.error);
reader.readAsDataURL(file);
});
}

function escapeHtml(value){
return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

function escapeAttr(value){return escapeHtml(value)}

function bindEvents(){
$("#homeSearchForm").onsubmit=e=>{e.preventDefault();search($("#homeSearchInput").value)};
$("#resultsSearchForm").onsubmit=e=>{e.preventDefault();search($("#resultsSearchInput").value)};
$("#settingsButton").onclick=openSettings;
$$("[data-tab]").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;$$("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));renderResults()});
document.addEventListener("click",e=>{
const image=e.target.closest(".image-open");
if(image){openImage(image.dataset.resultId,Number(image.dataset.index));return}
const video=e.target.closest(".video-open");
if(video){openVideo(video.dataset.resultId,Number(video.dataset.index));return}
if(e.target.matches("[data-refresh-quote]"))renderQuote();
if(e.target.matches("[data-close-modal]")||e.target.closest("[data-close-modal]"))closeModal();
if(e.target.matches("[data-close=\"settingsPanel\"]"))$("#settingsPanel").classList.add("hidden");
});
const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting))loadMore()},{rootMargin:"700px"});
observer.observe($("#resultsSentinel"));
window.addEventListener("hashchange",()=>{if(location.hash==="#home"||!location.hash)showPage("home")});
window.addEventListener("scroll",()=>{if(state.page==="results"&&settings.resultMode==="infinite"&&window.innerHeight+window.scrollY>=document.body.offsetHeight-700)loadMore()});
document.addEventListener("keydown",e=>{
if(!settings.easterEggs)return;
state.easterEggBuffer=(state.easterEggBuffer+e.key.toLowerCase()).slice(-20);
if(state.easterEggBuffer.includes("seerch")){state.easterEggBuffer="";toast("You found an Easter egg.");}
});
}

async function initialize(){
db=await openDB();
await loadSettings();
bindEvents();
await bindSettings();
applySettings();
renderQuote();
setupMusic();
showPage(location.hash==="#home"||!location.hash?"home":"results");
if(location.hash.startsWith("#search=")){
const q=decodeURIComponent(location.hash.slice(8));
$("#homeSearchInput").value=q;
await search(q);
}
}

document.addEventListener("DOMContentLoaded",initialize);
