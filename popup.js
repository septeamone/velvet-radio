import { STATIONS, COUNTRIES, maxKbps, shown as visibleQ, sortByOrder, pickKbps, stationsOf } from './stations.js';
import { t, notice as noticeText, detectLang, setLang, getLang, genreName, countryName, countryMatches, stationMatches, stationsWord } from './i18n.js';

const $ = (s) => document.querySelector(s);
const list = $('#list');
const player = $('.player');
const tabs = $('.tabs');

const ui = { tab: 'all', country: null, view: 'list', query: '', favs: new Set(), quality: {}, order: [], last: null, state: { stationId: null, kbps: null, status: 'stopped', volume: 0.8, track: null, notice: null, viz: false } };
const index = new Map(STATIONS.map((s) => [s.id, s]));
const byId = (id) => index.get(id);
const send = (msg) => chrome.runtime.sendMessage(msg);
const active = () => ui.state.status !== 'stopped';
const chosen = (s) => pickKbps(s, ui.quality[s.id]);

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
function applyTheme(theme) { document.documentElement.dataset.theme = theme; }
async function initTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  applyTheme(theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('no-anim')));
}
$('#theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
});

/* ---------- список ---------- */
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>';

// Логотип станции; если файла нет — буквенная плитка на цветном стекле.
function setLogo(el, s) {
  const img = new Image();
  img.alt = '';
  img.src = `logos/${s.id}.png`;
  img.addEventListener('error', () => { img.remove(); el.textContent = s.mark; });
  el.replaceChildren(img);
}

function buildSeg(s) {
  const seg = document.createElement('div');
  seg.className = 'seg';
  seg.setAttribute('role', 'group');
  seg.setAttribute('aria-label', t('quality'));
  const qs = visibleQ(s);
  seg.style.setProperty('--n', qs.length);
  seg.classList.toggle('one', qs.length === 1);
  seg.append(Object.assign(document.createElement('i'), { className: 'seg-thumb' }));
  for (const q of qs) {
    const b = document.createElement('button');
    b.dataset.k = q.kbps;
    b.textContent = q.kbps;
    b.title = q.note ?? `${q.kbps} kbps`;
    seg.append(b);
  }
  return seg;
}

const isRu = (s) => s.country === 'RU';
const flagSrc = (cc) => `flags/${cc.toLowerCase()}.svg`;
const countriesTop = () => ui.tab === 'countries' && !ui.country;
const countryList = () => COUNTRIES.filter((c) => stationsOf(c.cc).length);

function visible() {
  const q = ui.query.trim();
  const pool = ui.tab === 'all' ? STATIONS.filter(isRu)
    : ui.tab === 'fav' ? STATIONS.filter((s) => ui.favs.has(s.id))
    : ui.country ? stationsOf(ui.country)
    : STATIONS.filter((s) => !isRu(s));        // вкладка «Страны» без выбранной страны: станции показываем только как результат поиска
  return sortByOrder(ui.order, pool).filter((s) => !q || stationMatches(s, q));
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
  if (!isRu(s) && !(ui.tab === 'countries' && ui.country)) {            // в избранном и поиске показываем, из какой страны станция
    const f = Object.assign(new Image(), { className: 'cflag-s', alt: '', src: flagSrc(s.country) });
    genre.append(f, ` ${countryName(s.country)} · `);
  }
  genre.append(genreName(s.genre));
  li.querySelector('.heart').before(buildSeg(s));
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
  syncRows();
}

/* ---------- верхняя панель вкладки «Страны»: переключатель вида, «назад», подписи, язык ---------- */
function syncChrome() {
  const top = countriesTop(), inside = ui.tab === 'countries' && !!ui.country;
  $('#vtoggle').hidden = !top;
  $('#vtoggle').dataset.view = ui.view;
  $('#cbar').hidden = !inside;
  if (inside) {
    $('#cflag').src = flagSrc(ui.country);
    $('#cname').textContent = countryName(ui.country);
    $('#ccount').textContent = stationsWord(stationsOf(ui.country).length);
  }
  $('#q').placeholder = t(top ? 'searchCountries' : 'search');
}

function applyStatic() {
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-ta]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.ta)));
  document.querySelectorAll('[data-tt]').forEach((el) => { el.title = t(el.dataset.tt); });
  $('#langLabel').textContent = getLang().toUpperCase();
}

function openCountry(cc) {
  ui.country = cc; ui.query = ''; $('#q').value = '';
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
    row.classList.toggle('has-track', cur && !!track);
    if (cur && track) setMq(row.querySelector('.trk'), track);
    row.querySelector('.heart').classList.toggle('on', ui.favs.has(id));
    const sel = cur && kbps ? kbps : chosen(s);
    const qs = visibleQ(s);
    const idx = Math.max(0, qs.findIndex((q) => q.kbps === sel));
    const seg = row.querySelector('.seg');
    seg.style.setProperty('--i', idx);
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.k === qs[idx].kbps));
  });
}

list.addEventListener('click', (e) => {
  const crow = e.target.closest('.crow');
  if (crow) return openCountry(crow.dataset.cc);
  const row = e.target.closest('.row');
  if (!row) return;
  const id = row.dataset.id, s = byId(id);
  if (e.target.closest('.heart')) return toggleFav(id, row);
  const kb = e.target.closest('.seg button');
  if (kb) return setQuality(s, +kb.dataset.k);
  if (ui.state.stationId === id && active()) send({ type: 'stop' });
  else playStation(id);
});

function setQuality(s, kbps) {
  ui.quality[s.id] = kbps;
  chrome.storage.local.set({ quality: ui.quality });
  if (ui.state.stationId === s.id && active()) playStation(s.id); // переключаем «на лету»
  else syncRows();
}

function toggleFav(id, row) {
  ui.favs.has(id) ? ui.favs.delete(id) : ui.favs.add(id);
  chrome.storage.local.set({ favs: [...ui.favs] });
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
  if (!row || e.target.closest('.heart, .seg button')) return;
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
      chrome.storage.local.set({ order: ui.order });
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
  ui.tab = b.dataset.tab; ui.country = null;
  tabs.dataset.tab = ui.tab;
  tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  syncChrome();
  renderList();
});
$('#cback').addEventListener('click', () => { ui.country = null; ui.query = ''; $('#q').value = ''; syncChrome(); renderList(); });
$('#vtoggle').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-view]');
  if (!b || b.dataset.view === ui.view) return;
  ui.view = b.dataset.view;
  chrome.storage.local.set({ view: ui.view });
  syncChrome(); renderList();
});
$('#lang').addEventListener('click', () => {
  const next = getLang() === 'ru' ? 'en' : 'ru';
  setLang(next);
  chrome.storage.local.set({ lang: next });
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
    let sub = `${genreName(s.genre)} · ${q} kbps`, note = false;
    const nt = noticeText(notice);
    if (status === 'error') sub = t('unavailable');
    else if (status === 'loading') { sub = nt ?? t('connecting'); note = !!nt; }
    else if (status === 'playing') { sub = track ?? t('playingAt', { k: q }); if (nt && !track) { sub = nt; note = true; } }
    setMq($('#nowSub'), sub);
    const link = status === 'playing' && !!track;
    const row = $('#subRow');
    row.classList.toggle('link', link);
    row.title = link ? t('googleIt') : '';
    row.tabIndex = link ? 0 : -1;
    row.setAttribute('role', link ? 'link' : 'presentation');
    $('#nowSub').classList.toggle('err', status === 'error');
    $('#nowSub').classList.toggle('note', note);
  }
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
vol.addEventListener('input', () => { paintVol(); send({ type: 'volume', value: +vol.value }); });

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
  const on = ui.state.status === 'playing' && ui.state.viz;
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

/* ---------- старт ---------- */
(async () => {
  await initTheme();
  const saved = await chrome.storage.local.get(['favs', 'last', 'quality', 'order', 'lang', 'view']);
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
})();
