import { STATIONS, LOGOS, COUNTRIES, maxKbps, shown as visibleQ, sortByOrder, pickKbps, stationsOf } from './stations.js';
import { getSettings, saveSettings, exportBackup, importBackup, pullSync, pushSync, checkStations, DEFAULTS } from './settings.js';
import { LIVE, fetchTrack } from './nowplaying.js';
import { t, notice as noticeText, detectLang, setLang, getLang, genreName, countryName, countryMatches, stationMatches, stationsWord, setHomeCc } from './i18n.js';

const $ = (s) => document.querySelector(s);
const list = $('#list');
const player = $('.player');
const tabs = $('.tabs');

let fx = null;                                   // элементы нового вида (табло названия песни и др.); null в классическом виде
const ui = { tab: 'all', country: null, genre: null, settings: { ...DEFAULTS }, health: { bad: [] }, view: 'list', query: '', favs: new Set(), quality: {}, order: [], last: null, state: { stationId: null, kbps: null, status: 'stopped', volume: 0.8, track: null, notice: null, viz: false } };
const index = new Map(STATIONS.map((s) => [s.id, s]));
const byId = (id) => index.get(id);
const send = (msg) => chrome.runtime.sendMessage(msg);
const persist = (o) => chrome.storage.local.set(o).then(() => { if (ui.settings.sync) pushSync().catch(() => {}); });
const active = () => ui.state.status !== 'stopped';
const chosen = (s) => pickKbps(s, ui.quality[s.id], ui.settings.saver);

/* ---------- бегущая строка: длинный текст плавно ездит туда-обратно, короткий стоит ---------- */
const PX_PER_S = 34;
const mqObserver = new ResizeObserver((entries) => entries.forEach((e) => measureMq(e.target)));
function measureMq(el) {
  const inner = el.firstElementChild;
  if (!inner) return;
  el.classList.remove('scrolling');
  const over = Math.ceil(inner.scrollWidth - el.clientWidth);
  if (over > 2 && el.clientWidth > 0) {
    const shift = over + 14;                                     // чуть дальше, чтобы последний символ не прятался под затуханием
    el.style.setProperty('--shift', shift);
    el.style.setProperty('--dur', `${(shift / PX_PER_S) * 2 + 3.6}s`);
    void el.offsetWidth;                                         // перезапуск анимации
    el.classList.add('scrolling');
  }
}
function setMq(el, text) {
  let inner = el.firstElementChild;
  if (!inner?.classList.contains('mq')) {
    inner = document.createElement('span');
    inner.className = 'mq';
    el.replaceChildren(inner);
    mqObserver.observe(el);
  }
  if (inner.textContent !== text) { inner.textContent = text; measureMq(el); }
}

/* ---------- тема ---------- */
function applyTheme(theme) { document.documentElement.dataset.theme = theme; try { localStorage.setItem('vr-theme', theme); } catch {} }
// Новый вид по умолчанию; «классический» включается в настройках. Значение дублируется в localStorage, чтобы boot.js применил его до первой отрисовки.
function applyUi() {
  const ui_ = ui.settings.classic ? 'classic' : 'new';
  document.documentElement.dataset.ui = ui_;
  try { localStorage.setItem('vr-ui', ui_); } catch {}
}
async function initTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  applyTheme(theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('no-anim')));
}
// Смена темы: переходы цветов у сотен «стеклянных» плашек и размытых пятен фона отключаются на миг, а плавность даёт
// перекрёстное затухание снимков (View Transitions: считает видеокарта, а не страница). Раньше анимировалось всё сразу, отсюда падал FPS.
$('#theme').addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.classList.add('theme-switch');
  const done = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switch')));
  if (document.startViewTransition) document.startViewTransition(() => applyTheme(next)).finished.then(done, done);
  else { applyTheme(next); done(); }
  persist({ theme: next });
});

/* ---------- список ---------- */
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>';

// Логотип станции; если файла нет — буквенная плитка на цветном стекле.
function setLogo(el, s) {
  if (!LOGOS.has(s.id)) { el.textContent = s.mark; return; }
  const img = new Image();
  img.alt = '';
  img.src = `logos/${s.id}.png`;
  img.addEventListener('error', () => { img.remove(); el.textContent = s.mark; });
  el.replaceChildren(img);
}

const home = () => (stationsOf(ui.settings.home).length ? ui.settings.home : 'RU');   // главная страна: её станции на первой вкладке
const isHome = (s) => s.country === home();
const flagSrc = (cc) => `flags/${cc.toLowerCase()}.svg`;
const countriesTop = () => ui.tab === 'countries' && !ui.country;
const countryList = () => [{ cc: 'RU' }, ...COUNTRIES].filter((c) => c.cc !== home() && stationsOf(c.cc).length);

const genreKey = (g) => (typeof g === 'string' ? g : g.ru);
function basePool() {
  return ui.tab === 'all' ? stationsOf(home())
    : ui.tab === 'fav' ? STATIONS.filter((s) => ui.favs.has(s.id))
    : ui.country ? stationsOf(ui.country)
    : STATIONS.filter((s) => !isHome(s));        // вкладка «Страны» без выбранной страны: станции показываем только как результат поиска
}
function visible() {
  const q = ui.query.trim();
  return sortByOrder(ui.order, basePool()).filter((s) => (!q || stationMatches(s, q)) && (!ui.genre || genreKey(s.genre) === ui.genre));
}

function stationRow(s, i) {
  const li = document.createElement('li');
  li.className = 'row glass';
  li.addEventListener('animationend', (e) => { if (e.animationName === 'rise') li.classList.add('ready'); });
  li.dataset.id = s.id;
  li.style.setProperty('--i', Math.min(i, 12));
  li.innerHTML = `
    <div class="logo"></div>
    <div class="info">
      <div class="name"></div>
      <div class="meta"><span class="genre"></span><span class="trk"></span><span class="eq"><i></i><i></i><i></i></span></div>
    </div>
    <button class="heart" aria-label="${t('favAdd')}">${HEART}</button>`;
  li.querySelector('.logo').style.setProperty('--h', s.hue);
  setLogo(li.querySelector('.logo'), s);
  setMq(li.querySelector('.name'), s.name);
  const genre = li.querySelector('.genre');
  if (!isHome(s) && !(ui.tab === 'countries' && ui.country)) {            // в избранном и поиске показываем, из какой страны станция
    const f = Object.assign(new Image(), { className: 'cflag-s', alt: '', src: flagSrc(s.country) });
    genre.append(f, ` ${countryName(s.country)} · `);
  }
  genre.append(genreName(s.genre));
  li.querySelector('.heart').before(Object.assign(document.createElement('span'), { className: 'kb' }));
  if (ui.health.bad.includes(s.id)) { li.classList.add('bad'); li.title = t('badStation'); }
  return li;
}

function countryItem(cc, i) {
  const li = document.createElement('li');
  li.className = 'crow glass';
  li.dataset.cc = cc;
  li.style.setProperty('--i', Math.min(i, 14));
  li.innerHTML = `<img class="cflag" alt="" src="${flagSrc(cc)}"><div class="cinfo"><div class="cn"></div><div class="cs"></div></div><svg class="chev" viewBox="0 0 24 24"><path d="m9.5 6 6 6-6 6"/></svg>`;
  li.querySelector('.cn').textContent = countryName(cc);
  li.querySelector('.cs').textContent = stationsWord(stationsOf(cc).length);
  return li;
}

function renderList() {
  const q = ui.query.trim(), top = countriesTop();
  list.classList.toggle('locked', ui.tab !== 'all' || !!q);
  list.classList.toggle('tiles', top && ui.view === 'tiles');
  list.replaceChildren();
  let n = 0;
  if (top) {
    const cs = countryList().filter((c) => !q || countryMatches(c.cc, q));
    cs.forEach((c, i) => list.append(countryItem(c.cc, i)));
    n += cs.length;
  }
  if (!top || q) {
    const items = visible();
    if (top && items.length) list.append(Object.assign(document.createElement('li'), { className: 'lhead', textContent: t('stationsFound') }));
    items.forEach((s, i) => list.append(stationRow(s, i)));
    n += items.length;
  }
  if (!n) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = ui.tab === 'fav' && !ui.query ? t('emptyFav') : t('nothing');
    list.append(li);
  }
  kbd = -1;
  syncRows();
  for (const id of liveCache.keys()) applyLive(id);
  pollLive();
}

/* ---------- верхняя панель вкладки «Страны»: переключатель вида, «назад», подписи, язык ---------- */
function syncChrome() {
  const top = countriesTop(), inside = ui.tab === 'countries' && !!ui.country;
  $('#vtoggle').hidden = !top;
  $('#vtoggle').dataset.view = ui.view;
  $('#cbar').hidden = !inside;
  $('#gbtn').hidden = top;
  $('#gbtn').classList.toggle('on', !!ui.genre);
  $('#gpanel').hidden = true;
  if (inside) {
    $('#cflag').src = flagSrc(ui.country);
    $('#cname').textContent = countryName(ui.country);
    $('#ccount').textContent = stationsWord(stationsOf(ui.country).length);
  }
  $('#chome').hidden = !inside;
  if (inside) { $('#chome').textContent = t(ui.country === home() ? 'isHome' : 'makeHome'); $('#chome').disabled = ui.country === home(); }
  $('#q').placeholder = t(top ? 'searchCountries' : 'search');
}

function applyStatic() {
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-ta]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.ta)));
  document.querySelectorAll('[data-tt]').forEach((el) => { el.title = t(el.dataset.tt); });
  $('#langLabel').textContent = getLang().toUpperCase();
  setHomeCc(home());
  tabs.querySelector('[data-tab=all]').textContent = countryName(home());
  homeLabel();
  syncMute();
  for (const el of [$('#nowLogo'), $('#nowTitle')]) el.title = t('jumpTip');
}

function openCountry(cc) {
  ui.country = cc; ui.genre = null; ui.query = ''; $('#q').value = '';
  syncChrome(); renderList(); list.scrollTop = 0;
}

function syncRows() {
  const { stationId, status, kbps, track } = ui.state;
  list.querySelectorAll('.row').forEach((row) => {
    const id = row.dataset.id, s = byId(id);
    const cur = id === stationId && status !== 'stopped';
    row.classList.toggle('cur', cur);
    row.classList.toggle('playing', cur && status === 'playing');
    row.classList.toggle('loading', cur && status === 'loading');
    row.classList.toggle('bad', ui.health.bad.includes(id));
    row.classList.toggle('has-track', cur && !!track);
    if (cur && track) setMq(row.querySelector('.trk'), track);
    row.querySelector('.heart').classList.toggle('on', ui.favs.has(id));
    const sel = cur && kbps ? kbps : chosen(s);
    const qs = visibleQ(s);
    const idx = Math.max(0, qs.findIndex((q) => q.kbps === sel));
    const kb = row.querySelector('.kb');
    kb.textContent = qs[idx].kbps;
    kb.title = qs[idx].note ?? `${qs[idx].kbps} kbps`;
  });
  renderQuality();
  updateLocate();
}

list.addEventListener('click', (e) => {
  const crow = e.target.closest('.crow');
  if (crow) return openCountry(crow.dataset.cc);
  const row = e.target.closest('.row');
  if (!row) return;
  const id = row.dataset.id, s = byId(id);
  if (e.target.closest('.heart')) return toggleFav(id, row);
  if (ui.state.stationId === id && active()) send({ type: 'stop' });
  else playStation(id);
});

function setQuality(s, kbps) {
  ui.quality[s.id] = kbps;
  persist({ quality: ui.quality });
  if (ui.state.stationId === s.id && active()) playStation(s.id); // переключаем «на лету»
  else syncRows();
}

function toggleFav(id, row) {
  ui.favs.has(id) ? ui.favs.delete(id) : ui.favs.add(id);
  persist({ favs: [...ui.favs] });
  if (ui.tab === 'fav' && !ui.favs.has(id)) {
    row.classList.add('leaving');
    setTimeout(renderList, 280);
  } else syncRows();
}

function playStation(id) {
  ui.last = id;
  chrome.storage.local.set({ last: id });
  send({ type: 'play', id, kbps: chosen(byId(id)) });
}

/* ---------- список едет под плеером: резервируем место под его реальную высоту ---------- */
new ResizeObserver(() => $('.app').style.setProperty('--ph', `${player.offsetHeight}px`)).observe(player);

/* ---------- перетаскивание плашек: берёшь за любое место, тянешь, остальные плавно расступаются ---------- */
let drag = null, suppressClick = false, autoScroll = 0;

list.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || list.classList.contains('locked')) return;
  const row = e.target.closest('.row');
  if (!row || e.target.closest('.heart')) return;
  drag = { row, pid: e.pointerId, x: e.clientX, y: e.clientY, lastY: e.clientY, active: false };
});

function dragStart() {
  const d = drag, rows = [...list.querySelectorAll('.row')];
  Object.assign(d, {
    active: true, rows, from: rows.indexOf(d.row), tops: rows.map((r) => r.offsetTop), h: d.row.offsetHeight,
    slot: rows.length > 1 ? rows[1].offsetTop - rows[0].offsetTop : d.row.offsetHeight + 6, scroll0: list.scrollTop,
  });
  d.to = d.from;
  rows.forEach((r) => r !== d.row && r.classList.add('shift'));
  d.row.classList.add('dragging');
  list.classList.add('sorting');
  d.row.setPointerCapture?.(d.pid);
  autoScroll = setInterval(edgeScroll, 16);
}

function dragUpdate() {
  const d = drag;
  const dy = d.lastY - d.y + (list.scrollTop - d.scroll0);
  d.row.style.transform = `translateY(${dy}px) scale(1.025)`;
  const center = d.tops[d.from] + d.h / 2 + dy - d.tops[0];
  const to = Math.max(0, Math.min(d.rows.length - 1, Math.floor(center / d.slot)));
  if (to === d.to) return;
  d.to = to;
  d.rows.forEach((r, i) => {
    if (r === d.row) return;
    const sh = d.from < to && i > d.from && i <= to ? -d.slot : d.from > to && i >= to && i < d.from ? d.slot : 0;
    r.style.transform = sh ? `translateY(${sh}px)` : '';
  });
}

function edgeScroll() {              // у края списка он сам прокручивается
  if (!drag?.active) return;
  const r = list.getBoundingClientRect();
  const bottom = player.getBoundingClientRect().top;          // нижняя граница — верх плавающего плеера
  const zone = 44, speed = (n) => Math.ceil(n / 5);
  if (drag.lastY < r.top + zone) list.scrollTop -= speed(r.top + zone - drag.lastY);
  else if (drag.lastY > bottom - zone) list.scrollTop += speed(drag.lastY - (bottom - zone));
  dragUpdate();
}

document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  drag.lastY = e.clientY;
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    dragStart();
  }
  dragUpdate();
});

function dragEnd(cancel) {
  const d = drag; drag = null;
  if (!d?.active) return;
  clearInterval(autoScroll);
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 0);
  const to = cancel ? d.from : d.to;
  d.row.classList.remove('dragging');
  d.row.classList.add('settle');                                   // плашка плавно «садится» в свою ячейку
  d.row.style.transform = `translateY(${d.tops[to] - d.tops[d.from]}px)`;
  if (cancel) d.rows.forEach((r) => { r.style.transform = ''; });
  setTimeout(() => {
    const ids = d.rows.map((r) => r.dataset.id);
    ids.splice(to, 0, ids.splice(d.from, 1)[0]);
    d.rows.forEach((r) => { r.style.transition = 'none'; r.style.transform = ''; r.classList.remove('shift', 'settle'); });
    if (to !== d.from) list.insertBefore(d.row, to > d.from ? d.rows[to].nextSibling : d.rows[to]);
    void list.offsetWidth;
    d.rows.forEach((r) => { r.style.transition = ''; });
    list.classList.remove('sorting');
    if (!cancel && to !== d.from) {
      ui.order = [...ids, ...STATIONS.map((s) => s.id).filter((id) => !ids.includes(id))];
      persist({ order: ui.order });
    }
  }, 270);
}
document.addEventListener('pointerup', () => dragEnd(false));
document.addEventListener('pointercancel', () => dragEnd(true));
list.addEventListener('click', (e) => { if (suppressClick) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

/* ---------- вкладки и поиск ---------- */
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.tab === ui.tab) {                                    // повторный клик по «Странам» возвращает к списку стран
    if (ui.tab === 'countries' && ui.country) { ui.country = null; syncChrome(); renderList(); }
    return;
  }
  selectTab(b.dataset.tab);
});
function selectTab(name) {
  ui.tab = name; ui.country = null; ui.genre = null;
  tabs.dataset.tab = name;
  tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.tab === name));
  syncChrome();
  renderList();
}
// Сделать страну главной: её станции встают на первую вкладку, прежняя главная (по умолчанию Россия) уходит во вкладку «Страны»
function goHomeTab() {
  ui.country = null; ui.genre = null; ui.query = ''; $('#q').value = '';
  ui.tab = 'all'; tabs.dataset.tab = 'all';
  tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.tab === 'all'));
  syncChrome(); renderList(); list.scrollTop = 0;
}
async function setHome(cc) {
  if (cc === home()) return;
  ui.settings = await saveSettings({ home: cc });
  applyStatic();
  goHomeTab();
}
$('#chome').addEventListener('click', () => setHome(ui.country));

/* ---------- тур для новых пользователей (код грузится только когда он нужен) ---------- */
let tourCtl = null;
async function runTour(saved) {
  if (!tourCtl) {
    const { createTour } = await import('./ui/tour.js');
    tourCtl = createTour({
      t, lang: getLang, home, countryName, flagSrc, setHome,
      countries: () => [{ cc: 'RU' }, ...COUNTRIES].map((c) => c.cc).filter((cc) => stationsOf(cc).length),
      save: (s) => chrome.storage.local.set({ tour: s }),
      prepare() { openSettings(false); $('#gpanel').hidden = true; if (ui.tab !== 'all' || ui.country || ui.query || ui.genre) goHomeTab(); list.scrollTop = 0; },
    });
  }
  tourCtl.start(saved);
}
$('#btour').addEventListener('click', () => {
  const s = { v: 1, step: 0, done: false, picked: true };      // повтор: выбранную страну не трогаем
  openSettings(false);
  chrome.storage.local.set({ tour: s });
  runTour(s);
});
$('#cback').addEventListener('click', () => { ui.country = null; ui.genre = null; ui.query = ''; $('#q').value = ''; syncChrome(); renderList(); });
$('#vtoggle').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-view]');
  if (!b || b.dataset.view === ui.view) return;
  ui.view = b.dataset.view;
  persist({ view: ui.view });
  syncChrome(); renderList();
});
$('#lang').addEventListener('click', () => {
  const next = getLang() === 'ru' ? 'en' : 'ru';
  setLang(next);
  persist({ lang: next });
  applyStatic(); syncChrome(); renderList(); renderPlayer();
});
$('#q').addEventListener('input', (e) => { ui.query = e.target.value; renderList(); });

/* ---------- плеер ---------- */
function renderPlayer() {
  const { stationId, status, kbps, track, notice } = ui.state;
  const s = byId(stationId ?? ui.last);
  const logo = $('#nowLogo');
  player.classList.toggle('on', status === 'playing' || status === 'loading');
  player.classList.toggle('loading', status === 'loading');
  player.classList.toggle('err', status === 'error');
  if (s) {
    logo.className = 'logo';
    logo.style.setProperty('--h', s.hue);
    if (logo.dataset.id !== s.id) { logo.dataset.id = s.id; setLogo(logo, s); }
    setMq($('#nowTitle'), s.name);
    const q = kbps ?? chosen(s);
    let sub = genreName(s.genre), note = false;
    const nt = noticeText(notice);
    if (status === 'error') sub = t('unavailable');
    else if (status === 'loading') { sub = nt ?? t('connecting'); note = !!nt; }
    else if (status === 'playing') { sub = track ?? t('playingAt', { k: q }); if (nt && !track) { sub = nt; note = true; } }
    setMq($('#nowSub'), sub);
    fx?.flap?.update(sub, status === 'playing' && !!track);
    const link = status === 'playing' && !!track;
    const row = $('#subRow');
    row.classList.toggle('link', link);
    row.title = link ? t('googleIt') : '';
    row.tabIndex = link ? 0 : -1;
    row.setAttribute('role', link ? 'link' : 'presentation');
    $('#nowSub').classList.toggle('err', status === 'error');
    $('#nowSub').classList.toggle('note', note);
  }
  renderDot();
  syncRows();
  syncViz();
}

function openSearch() {
  const { track, status } = ui.state;
  if (status !== 'playing' || !track) return;
  chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(track)}` });
}
$('#subRow').addEventListener('click', openSearch);
$('#subRow').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSearch(); } });

$('#toggle').addEventListener('click', () => {
  const { stationId, status } = ui.state;
  if (status === 'stopped' || status === 'error') playStation(stationId ?? ui.last ?? STATIONS[0].id);
  else send({ type: 'stop' });
});
$('#retry').addEventListener('click', () => playStation(ui.state.stationId ?? ui.last));

const vol = $('#vol');
const paintVol = () => vol.style.setProperty('--p', `${vol.value * 100}%`);
let volSave = 0;
vol.addEventListener('input', () => {
  paintVol();
  const value = +vol.value;
  chrome.runtime.sendMessage({ target: 'offscreen', cmd: 'volume', volume: value }).catch(() => {});   // сразу в плеер, без обходов через фон
  clearTimeout(volSave);
  volSave = setTimeout(() => send({ type: 'volume', value }), 200);                                  // сохранение и состояние — с паузой, а не на каждое движение
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'state') return;
  ui.state = msg.state;
  renderPlayer();
});

/* ---------- визуализатор: тонкая тихая полоска, только если поток отдаёт звук для анализа ---------- */
const canvas = $('#viz');
const g = canvas.getContext('2d');
const BANDS = 32;
const target = new Float32Array(BANDS), shown = new Float32Array(BANDS), slow = new Float32Array(BANDS);
let port = null, raf = 0, vizColor = '';

function syncViz() {
  const on = ui.settings.showViz && ui.state.status === 'playing' && ui.state.viz;
  canvas.classList.toggle('off', !on);
  canvas.classList.toggle('on', on);
  if (on && !port) {
    port = chrome.runtime.connect({ name: 'viz' });
    // Бас громче верхов, поэтому верхние полосы слегка усиливаем.
    port.onMessage.addListener((arr) => arr.forEach((v, i) => { target[i] = Math.min(1, v * (0.7 + 1.3 * i / BANDS)); }));
    port.onDisconnect.addListener(() => { port = null; });
  } else if (!on && port) { port.disconnect(); port = null; target.fill(0); }
  if (on && !raf) raf = requestAnimationFrame(draw);
}

function draw() {
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = devicePixelRatio || 1;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);

  // Линия «танцует» по изменениям: быстрый подъём на всплеске, мягкий спад, отсчёт — от долгого среднего каждой полосы.
  let energy = 0, mean = 0;
  for (let i = 0; i < BANDS; i++) {
    shown[i] += (target[i] - shown[i]) * (target[i] > shown[i] ? 0.5 : 0.16);
    slow[i] += (shown[i] - slow[i]) * 0.012;
    energy += shown[i]; mean += shown[i];
  }
  mean /= BANDS;
  let pts = Array.from(shown, (v, i) => (v - slow[i]) * 4.6);   // только изменения относительно привычного уровня — без постоянного перекоса
  pts = pts.map((v, i) => (pts[i - 1] ?? v) * 0.25 + v * 0.5 + (pts[i + 1] ?? v) * 0.25); // один лёгкий проход — плавно, но не «мёртво»

  const mid = h / 2, amp = h / 2 - 3, pad = 4, step = (w - pad * 2) / (BANDS - 1);
  const xy = pts.map((v, i) => [pad + i * step, mid - Math.max(-1, Math.min(1, v * Math.sin(Math.PI * i / (BANDS - 1)) ** 0.6)) * amp]); // оба конца «пришиты» к центру
  g.beginPath();
  g.moveTo(xy[0][0], xy[0][1]);
  for (let i = 1; i < xy.length - 1; i++) {
    const [x, y] = xy[i], [nx, ny] = xy[i + 1];
    g.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);     // кривая через середины отрезков = мягкий изгиб
  }
  g.lineTo(...xy[xy.length - 1]);
  const css = getComputedStyle(document.documentElement);
  const grad = g.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.18, css.getPropertyValue('--accent').trim());
  grad.addColorStop(0.82, css.getPropertyValue('--accent2').trim());
  grad.addColorStop(1, 'transparent');
  g.strokeStyle = grad; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
  g.globalAlpha = 0.6; g.shadowBlur = 8; g.shadowColor = css.getPropertyValue('--accent').trim();
  g.stroke();
  g.globalAlpha = 1; g.shadowBlur = 0;
  raf = (ui.state.viz && ui.state.status === 'playing') || energy > 0.02 ? requestAnimationFrame(draw) : 0;
}

/* ---------- индикатор потока: зелёный — играет, жёлтый — подключение/резерв, красный — недоступна; в подсказке кодек ---------- */
function renderDot() {
  const { status, notice, kbps, codec } = ui.state;
  const st = status === 'playing' ? (notice ? 'warn' : 'ok') : status === 'loading' ? 'warn' : status === 'error' ? 'bad' : 'off';
  $('#dot').dataset.st = st;
  $('.logo-wrap').title = st === 'off' ? '' : [t({ ok: 'dotOk', warn: 'dotWarn', bad: 'dotBad' }[st]), codec, kbps && `${kbps} kbps`, noticeText(notice)].filter(Boolean).join(' · ');
}

$('#report').addEventListener('click', () => {
  const s = byId(ui.state.stationId ?? ui.last);
  if (!s) return;
  const title = `${s.name} (${s.id}, ${ui.state.kbps ?? '?'} kbps): ${getLang() === 'ru' ? 'не играет' : 'not playing'}`;
  chrome.tabs.create({ url: `https://github.com/septeamone/velvet-radio/issues/new?template=station-not-working.md&title=${encodeURIComponent(title)}` });
});

/* ---------- фильтр по жанрам ---------- */
function renderGenres() {
  const counts = new Map(), label = new Map();
  for (const s of basePool()) { const k = genreKey(s.genre); counts.set(k, (counts.get(k) ?? 0) + 1); label.set(k, s.genre); }
  const panel = $('#gpanel');
  panel.replaceChildren();
  const chip = (key, text, n) => {
    const b = document.createElement('button');
    b.className = 'chip' + ((ui.genre ?? '') === key ? ' on' : '');
    b.dataset.g = key;
    b.textContent = n ? `${text} ${n}` : text;
    panel.append(b);
  };
  chip('', t('genreAll'), 0);
  [...counts.entries()].sort((a, b) => b[1] - a[1] || genreName(label.get(a[0])).localeCompare(genreName(label.get(b[0])))).forEach(([k, n]) => chip(k, genreName(label.get(k)), n));
}
$('#gbtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const panel = $('#gpanel');
  if (panel.hidden) renderGenres();
  panel.hidden = !panel.hidden;
});
$('#gpanel').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  ui.genre = b.dataset.g || null;
  $('#gpanel').hidden = true;
  $('#gbtn').classList.toggle('on', !!ui.genre);
  renderList();
});
document.addEventListener('click', (e) => { if (!e.target.closest('#gpanel, #gbtn')) $('#gpanel').hidden = true; });

/* ---------- «что играет везде»: названия песен прямо в списке, пока окно открыто ---------- */
const liveCache = new Map();
async function pollLive() {
  const ids = [...list.querySelectorAll('.row')].map((r) => r.dataset.id).filter((id) => LIVE.has(id));
  const stale = ids.filter((id) => Date.now() - (liveCache.get(id)?.t ?? 0) > 40000);
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < stale.length) {
      const id = stale[i++];
      const title = await fetchTrack(id).catch(() => null);
      liveCache.set(id, { t: Date.now(), title: title ?? liveCache.get(id)?.title ?? null });
      applyLive(id);
    }
  }));
}
function applyLive(id) {
  const row = list.querySelector(`.row[data-id="${id}"]`), title = liveCache.get(id)?.title;
  if (!row || !title || row.classList.contains('cur')) return;      // у играющей станции название ведёт плеер
  setMq(row.querySelector('.trk'), title);
  row.classList.add('has-live');
}
setInterval(pollLive, 45000);

/* ---------- клавиатура: / — поиск, стрелки и Enter — выбор станции, Esc — назад ---------- */
let kbd = -1;
const navItems = () => [...list.querySelectorAll('.row, .crow')];
function setKbd(i) {
  const its = navItems();
  its.forEach((x) => x.classList.remove('kbd'));
  if (!its.length) return;
  kbd = (i + its.length) % its.length;
  its[kbd].classList.add('kbd');
  its[kbd].scrollIntoView({ block: 'nearest' });
}
document.addEventListener('keydown', (e) => {
  if (!$('#settings').hidden) { if (e.key === 'Escape') openSettings(false); return; }
  if (e.target.matches?.('input[type=range], button')  && e.key !== 'Escape' && e.key !== '/') return;
  const typing = e.target.matches?.('input[type=search]');
  if (e.key === '/' && !typing) { e.preventDefault(); $('#q').focus(); return; }
  if ((e.key === 'm' || e.key === 'ь') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleMute(); return; }
  if (e.key === 'Escape') {
    if (typing && $('#q').value) { $('#q').value = ''; ui.query = ''; renderList(); }
    else if (ui.country) $('#cback').click();
    else $('#q').blur();
    return;
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); setKbd(kbd < 0 ? 0 : kbd + 1); return; }
  if (e.key === 'ArrowUp') { e.preventDefault(); setKbd(kbd < 0 ? -1 : kbd - 1); return; }
  if (e.key === 'Enter') { const its = navItems(); (its[kbd] ?? (typing ? its[0] : null))?.click(); }
});

/* ---------- настройки ---------- */
const settingsEl = $('#settings');
function openSettings(on) {
  settingsEl.hidden = !on;
  if (!on) homeDd.open(false);
  $('#gear').classList.toggle('on', on);
  if (on) syncSettingsUI();
}
$('#gear').addEventListener('click', () => openSettings(settingsEl.hidden));
$('#setback').addEventListener('click', () => openSettings(false));

function renderHealth() {
  const h = ui.health, ul = $('#badlist');
  ul.replaceChildren();
  if (!h.t) { $('#checkInfo').textContent = t('sNeverChecked'); return; }
  $('#checkInfo').textContent = h.bad.length ? t('sChecked', { n: h.n, p: h.bad.length }) : t('sAllOk', { n: h.n });
  for (const id of h.bad) ul.append(Object.assign(document.createElement('li'), { textContent: byId(id)?.name ?? id }));
}
function syncSettingsUI() {
  settingsEl.querySelectorAll('input[data-set]').forEach((el) => { el.checked = !!ui.settings[el.dataset.set]; });
  const seg = $('#bufseg'), vals = [4, 9, 14];
  seg.style.setProperty('--i', Math.max(0, vals.indexOf(ui.settings.buffer)));
  seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.k === ui.settings.buffer));
  homeLabel();
  $('#ver').textContent = `Velvet Radio ${chrome.runtime.getManifest().version}`;
  renderHealth();
}
/* ---------- выпадающие списки «Моя страна» и качество звука: свои, без системной рамки; прокрутка как у списка станций (ui/animated-list.js) ---------- */
function dropdown({ btn, wrap, menu, items, pick, up = null, minW = 212, min = 1 }) {
  const H = 252;
  let shown = [];
  const rows = () => [...menu.children];
  function open(on) {
    if (on === !wrap.hidden) return;
    btn.setAttribute('aria-expanded', String(on));
    if (!on) { wrap.hidden = true; return; }
    shown = items();
    if (shown.length < min) { btn.setAttribute('aria-expanded', 'false'); return; }
    const r = btn.getBoundingClientRect(), w = Math.max(minW, r.width);
    const room = { below: innerHeight - r.bottom - 16, above: r.top - 16 };
    const need = Math.min(H, shown.length * 34 + 12);
    const above = up ?? (room.below < need && room.above > room.below);
    menu.style.maxHeight = Math.min(H, above ? room.above : room.below) - 12 + 'px';
    wrap.classList.toggle('up', above);
    Object.assign(wrap.style, { width: w + 'px', left: Math.max(10, Math.min(r.right - w, innerWidth - w - 10)) + 'px',
      top: above ? 'auto' : r.bottom + 6 + 'px', bottom: above ? innerHeight - r.top + 6 + 'px' : 'auto' });
    wrap.hidden = false;                         // сначала показываем: модуль прокрутки меряет строки только в видимом списке
    menu.replaceChildren(...shown.map((it, i) => {
      const li = document.createElement('li');
      li.className = 'hrow'; li.dataset.i = i; Object.assign(li.dataset, it.data); li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(!!it.cur));
      li.classList.toggle('cur', !!it.cur); li.classList.toggle('has-sub', !!it.sub);
      li.innerHTML = `${it.flag ? '<img class="hflag" alt="">' : ''}<span class="hn"><span class="ht"></span>${it.sub ? '<small class="hs"></small>' : ''}</span><svg class="hck" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
      if (it.flag) li.querySelector('img').src = it.flag;
      li.querySelector('.ht').textContent = it.label;
      if (it.sub) li.querySelector('.hs').textContent = it.sub;
      return li;
    }));
    const cur = rows().find((x) => x.classList.contains('cur'));
    cur?.classList.add('kbd');
    if (cur) menu.scrollTop = Math.max(0, cur.offsetTop - (menu.clientHeight - cur.offsetHeight) / 2);
  }
  btn.addEventListener('click', () => open(wrap.hidden));
  btn.addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp'].includes(e.key) && wrap.hidden) { e.preventDefault(); open(true); } });
  menu.addEventListener('click', (e) => {
    const li = e.target.closest('.hrow');
    if (!li) return;
    open(false);
    pick(shown[+li.dataset.i]);
  });
  document.addEventListener('pointerdown', (e) => { if (!wrap.hidden && !e.target.closest(`#${wrap.id}, #${btn.id}`)) open(false); });
  window.addEventListener('keydown', (e) => {      // до остальных обработчиков окна: Esc закрывает только список, а не всё окно
    if (wrap.hidden) return;
    const its = rows();
    let k = its.findIndex((x) => x.classList.contains('kbd'));
    const move = (n) => { its[k]?.classList.remove('kbd'); k = Math.max(0, Math.min(its.length - 1, n)); its[k].classList.add('kbd'); };
    if (e.key === 'ArrowDown') move(k + 1);
    else if (e.key === 'ArrowUp') move(k - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(its.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') its[k]?.click();
    else if (e.key === 'Escape') { open(false); btn.focus(); }
    else if (e.key === 'Tab') { open(false); return; }
    else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  return { open, get isOpen() { return !wrap.hidden; } };
}

const homeBtn = $('#homeBtn');
function homeLabel() {
  $('#homeName').textContent = countryName(home());
  $('#homeFlag').src = flagSrc(home());
}
const homeDd = dropdown({
  btn: homeBtn, wrap: $('#homeWrap'), menu: $('#homeMenu'),
  items: () => [{ cc: 'RU' }, ...COUNTRIES].map((c) => c.cc).filter((cc) => stationsOf(cc).length)
    .sort((a, b) => countryName(a).localeCompare(countryName(b), getLang()))
    .map((cc) => ({ label: countryName(cc), flag: flagSrc(cc), cur: cc === home(), data: { cc } })),
  pick: async (it) => { await setHome(it.data.cc); syncSettingsUI(); },
});
$('.setbody').addEventListener('scroll', () => homeDd.open(false), { passive: true });

/* ---------- качество звука: кнопка с битрейтом в плеере (вместо трёх кнопок в каждой строке) ---------- */
const qbtn = $('#qbtn');
const nowStation = () => byId(ui.state.stationId ?? ui.last);
const shownKbps = (s) => (ui.state.stationId === s.id && ui.state.status !== 'stopped' && ui.state.kbps ? ui.state.kbps : chosen(s));
const qualityDd = dropdown({
  btn: qbtn, wrap: $('#qWrap'), menu: $('#qMenu'), up: true, minW: 210, min: 2,
  items: () => { const s = nowStation(); return s ? [...visibleQ(s)].reverse().map((q) => ({ label: `${q.kbps} kbps`, sub: q.note, cur: q.kbps === shownKbps(s), data: { k: q.kbps } })) : []; },
  pick: (it) => { const s = nowStation(); if (s) setQuality(s, +it.data.k); },
});
function renderQuality() {
  const s = nowStation();
  qbtn.hidden = !s;
  if (!s) return;
  const one = visibleQ(s).length < 2;
  $('#qval').textContent = shownKbps(s);
  qbtn.classList.toggle('one', one);
  qbtn.setAttribute('aria-disabled', String(one));
}

/* ---------- заглушить: клик по значку динамика и клавиша M ---------- */
const quietIcon = document.querySelector('.vol > svg');
let preMute = 0.8;
function syncMute() {
  const label = t(+vol.value === 0 ? 'unmute' : 'mute');
  quietIcon.setAttribute('aria-label', label);
  quietIcon.title = label;
}
function toggleMute() {
  if (+vol.value > 0) { preMute = +vol.value; vol.value = 0; } else vol.value = preMute || 0.8;
  vol.dispatchEvent(new Event('input', { bubbles: true }));
}
quietIcon.setAttribute('role', 'button'); quietIcon.tabIndex = 0;
quietIcon.addEventListener('click', toggleMute);
quietIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMute(); } });
vol.addEventListener('input', syncMute);

/* ---------- вернуться к играющей станции: клик по логотипу и названию в плеере и плавающая кнопка, когда строка вне экрана ---------- */
const locateBtn = $('#locate');
let locRaf = 0;
function updateLocate() {
  cancelAnimationFrame(locRaf);
  locRaf = requestAnimationFrame(() => {
    const { stationId, status } = ui.state;
    const row = stationId && status !== 'stopped' ? list.querySelector(`.row[data-id="${stationId}"]`) : null;
    let dir = 0;
    if (row && !list.classList.contains('sorting')) {
      const lr = list.getBoundingClientRect(), rr = row.getBoundingClientRect(), bottom = Math.min(lr.bottom, player.getBoundingClientRect().top);
      if (rr.bottom < lr.top + 14) dir = -1; else if (rr.top > bottom - 14) dir = 1;
    }
    locateBtn.hidden = !dir;
    if (!dir) return;
    const a = $('.app').getBoundingClientRect(), lr = list.getBoundingClientRect(), pr = player.getBoundingClientRect();
    locateBtn.dataset.dir = dir;
    locateBtn.style.top = dir < 0 ? `${lr.top - a.top + 10}px` : `${Math.min(lr.bottom, pr.top) - a.top - 30 - 10}px`;
  });
}
list.addEventListener('scroll', updateLocate, { passive: true });
function revealPlaying() {
  const id = ui.state.stationId ?? ui.last, s = byId(id);
  if (!s) return;
  let row = list.querySelector(`.row[data-id="${id}"]`);
  if (!row) {                                           // станция в другой вкладке или скрыта поиском и жанром
    ui.query = ''; $('#q').value = ''; ui.genre = null;
    if (isHome(s)) goHomeTab(); else { selectTab('countries'); openCountry(s.country); }
    row = list.querySelector(`.row[data-id="${id}"]`);
  }
  if (!row) return;
  const cover = Math.max(0, list.getBoundingClientRect().bottom - player.getBoundingClientRect().top);
  list.scrollTo({ top: Math.max(0, row.offsetTop - (list.clientHeight - cover - row.offsetHeight) / 2), behavior: 'smooth' });
  row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
  setTimeout(() => row.classList.remove('flash'), 1500);
}
locateBtn.addEventListener('click', revealPlaying);
for (const el of [$('#nowLogo'), $('#nowTitle')]) { el.addEventListener('click', revealPlaying); el.style.cursor = 'pointer'; }
settingsEl.addEventListener('change', async (e) => {
  const k = e.target.dataset?.set;
  if (!k) return;
  if (k === 'sync' && e.target.checked) {        // при включении сначала забираем более свежие данные из облака, а не затираем их
    const changed = await pullSync().catch(() => false);
    if (changed) { await chrome.storage.local.set({ settings: { ...ui.settings, sync: true } }); location.reload(); return; }
  }
  ui.settings = await saveSettings({ [k]: e.target.checked });
  if (k === 'saver') { renderList(); renderPlayer(); }
  if (k === 'showViz') syncViz();
  if (k === 'classic') { applyUi(); location.reload(); }       // чистая смена вида: старые элементы снимаются перезагрузкой окна
});
$('#bufseg').addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  ui.settings = await saveSettings({ buffer: +b.dataset.k });
  syncSettingsUI();
});
$('#bexp').addEventListener('click', async () => {
  const blob = new Blob([JSON.stringify(await exportBackup(), null, 1)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `velvet-radio-backup-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('#bimp').addEventListener('click', () => $('#bfile').click());
$('#bfile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try { await importBackup(JSON.parse(await f.text())); $('#checkInfo').textContent = t('sImported'); setTimeout(() => location.reload(), 600); }
  catch { $('#checkInfo').textContent = t('sBadFile'); }
});
async function runCheck() {
  const ids = new Set([...ui.favs, ui.last].filter(Boolean));
  const list = [...ids].map(byId).filter(Boolean).slice(0, 40);
  if (!list.length) return;
  $('#bcheck').disabled = true;
  ui.health = await checkStations(list, ui.quality, (a, b) => { $('#checkInfo').textContent = t('sChecking', { a, b }); });
  $('#bcheck').disabled = false;
  renderHealth(); renderList();
}
$('#bcheck').addEventListener('click', runCheck);
$('#bkeys').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));

/* ---------- старт ---------- */
(async () => {
  ui.settings = await getSettings();
  if (ui.settings.sync) await pullSync().catch(() => {});
  applyUi();
  await initTheme();
  const saved = await chrome.storage.local.get(['favs', 'last', 'quality', 'order', 'lang', 'view', 'health', 'tour']);
  ui.health = saved.health ?? { bad: [] };
  setLang(saved.lang ?? detectLang());
  ui.view = saved.view === 'tiles' ? 'tiles' : 'list';
  applyStatic();
  ui.order = saved.order ?? [];
  ui.favs = new Set(saved.favs ?? []);
  ui.last = saved.last ?? null;
  ui.quality = saved.quality ?? {};
  ui.state = await send({ type: 'get-state' });
  vol.value = ui.state.volume;
  paintVol();
  syncChrome();
  renderList();
  renderPlayer();
  // Элементы нового вида подгружаем и подключаем сразу после первого показа окна, чтобы их файлы не задерживали открытие (замер: окно открывается как прежде).
  if (!ui.settings.classic) requestAnimationFrame(() => setTimeout(async () => { fx = (await import('./ui/index.js')).mountNewUi($, list); document.documentElement.classList.add('rb-ready'); }, 0));
  if (saved.tour && !saved.tour.done) setTimeout(() => runTour(saved.tour), 500);        // новая установка или незаконченный тур: продолжаем с сохранённого шага
  if (ui.favs.size && (!ui.health.t || Date.now() - ui.health.t > 864e5)) runCheck();   // раз в сутки, тихо, пока окно открыто
})();
