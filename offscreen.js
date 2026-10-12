import { STATIONS } from './stations.js';
import { fetchTrack } from './nowplaying.js';

const CONNECT_MS = 15000;  // сколько ждём старта потока (включая набор буфера)
const PREBUFFER_S = 4;     // запас звука перед стартом: сглаживает просадки сети и нагрузки на ПК
const STALL_MS = 9000;     // сколько терпим «зависший» звук
const BANDS = 32;

let session = 0;           // номер текущего запуска: старые попытки сами отменяются
let current = null;        // { audio, hls, analyser, data }
let volume = 0.8;
let prebuffer = PREBUFFER_S, fadeOn = true;   // из настроек окна; по умолчанию как раньше
let vizPort = null;
let ctx = null;
let trackTimer = 0, watchdog = 0, vizTimer = 0;

const byId = (id) => STATIONS.find((s) => s.id === id);

/* ---------- системные медиа-кнопки: клавиатура, наушники, оверлей Windows ---------- */
const ms = navigator.mediaSession;
const media = (action) => () => chrome.runtime.sendMessage({ type: 'media', action }).catch(() => {});
for (const [a, act] of [['play', 'play'], ['pause', 'pause'], ['nexttrack', 'next'], ['previoustrack', 'previous']]) {
  try { ms.setActionHandler(a, media(act)); } catch { /* браузер не знает такое действие */ }
}
// MediaSession не принимает chrome-extension://, поэтому логотип из пакета отдаём как blob:
const art = {};
const artwork = (id) => (art[id] ??= fetch(chrome.runtime.getURL(`logos/${id}.png`)).then((r) => r.blob()).then(URL.createObjectURL));
async function setMedia(st, tier, track) {
  const src = await artwork(st.id).catch(() => null);
  if (!current) return; // станцию успели остановить, пока грузился логотип
  ms.playbackState = 'playing';
  ms.metadata = new MediaMetadata({
    title: track ?? st.name,
    artist: track ? st.name : st.genre,
    album: `${tier.kbps} kbps`,
    artwork: src ? [{ src, sizes: '128x128', type: 'image/png' }] : [],
  });
}
const report = (patch) => chrome.runtime.sendMessage({ type: 'status', patch }).catch(() => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- воспроизведение ---------- */
// Полностью отпускает поток: без этого брошенное соединение висит, пока его не соберёт сборщик мусора.
function release({ audio, hls }) {
  if (hls) hls.destroy();
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

function dispose() {
  clearInterval(watchdog); clearInterval(trackTimer);
  if (!current) return;
  const old = current;
  current = null;
  release(old);
}

// Пробует один адрес. withCors — нужен для визуализатора; без него звук всё равно играет.
function tryUrl(url, isHls, withCors, my) {
  return new Promise((resolve) => {
    const audio = new Audio();
    if (withCors) audio.crossOrigin = 'anonymous';
    audio.volume = fadeOn ? 0 : volume;       // при плавном старте звук нарастает из тишины (rampIn)
    let hls = null, done = false;
    const finish = (ok) => {
      if (done) return;
      done = true; clearTimeout(timer);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      if (ok && my === session) return resolve({ audio, hls, withCors, url, isHls });
      if (hls) hls.destroy();
      audio.pause(); audio.removeAttribute('src'); audio.load();
      resolve(null);
    };
    const onPlaying = () => finish(true);
    const onError = () => finish(false);
    const timer = setTimeout(() => finish(false), CONNECT_MS);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);
    if (isHls && window.Hls && Hls.isSupported()) {
      hls = new Hls();
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) finish(false); });
      hls.loadSource(url);
      hls.attachMedia(audio);
      audio.play().catch(() => {});
    } else {
      audio.preload = 'auto';
      audio.src = url;
      // Не запускаем звук сразу: ждём, пока накопится запас, иначе любая просадка = заикание.
      const t0 = Date.now();
      const wait = setInterval(() => {
        if (done) return clearInterval(wait);
        const b = audio.buffered, ahead = b.length ? b.end(b.length - 1) - audio.currentTime : 0;
        if (ahead >= prebuffer || (ahead > 0.5 && Date.now() - t0 > 9000)) { clearInterval(wait); audio.play().catch(() => {}); }
      }, 150);
    }
  });
}

async function connect(url, isHls, my) {
  const a = await tryUrl(url, isHls, true, my);
  if (a || my !== session) return a;
  return tryUrl(url, isHls, false, my); // сервер не разрешает анализ звука — играем без визуализатора
}

async function attachAnalyser(c) {
  if (!c.withCors) return false;
  try {
    ctx ??= new AudioContext({ latencyHint: 'playback' }); // большие буферы = без щелчков при нагрузке на ПК
    if (ctx.state !== 'running') await ctx.resume();
    if (ctx.state !== 'running') return false; // иначе звук ушёл бы в «молчащий» граф
    const src = ctx.createMediaElementSource(c.audio);
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    an.smoothingTimeConstant = 0.6;
    src.connect(an); an.connect(ctx.destination);
    c.analyser = an; c.data = new Uint8Array(an.frequencyBinCount);
    return true;
  } catch { return false; }
}

// Плавные переходы: старый звук затухает, новый нарастает (меняется только громкость элемента, не движок).
const FADE_OUT_MS = 220, FADE_IN_MS = 450;
async function fadeOutCurrent() {
  const c = current;
  if (!c || !fadeOn) return;
  const v0 = c.audio.volume, t0 = performance.now();
  while (performance.now() - t0 < FADE_OUT_MS) {
    if (current !== c) return;
    c.audio.volume = v0 * (1 - (performance.now() - t0) / FADE_OUT_MS);
    await sleep(16);
  }
}
async function rampIn(c) {
  if (!fadeOn) return;
  const t0 = performance.now();
  while (performance.now() - t0 < FADE_IN_MS) {
    if (current !== c) return;
    c.audio.volume = volume * ((performance.now() - t0) / FADE_IN_MS);
    await sleep(16);
  }
  if (current === c) c.audio.volume = volume;
}
const codecOf = (c) => (c.isHls ? 'HLS' : /aac/i.test(c.url) ? 'AAC' : /\.(ogg|opus)/i.test(c.url) ? 'OGG' : 'MP3');

async function start(id, kbps) {
  const my = ++session;
  await fadeOutCurrent();
  if (my !== session) return;
  dispose();
  const st = byId(id);
  if (!st) return;
  const tiers = st.qualities.filter((q) => q.kbps <= kbps).reverse(); // выбранное качество, затем ниже
  if (!tiers.length) tiers.push(st.qualities[0]);
  report({ status: 'loading', kbps: tiers[0].kbps, notice: null, track: null, viz: false });

  for (let t = 0; t < tiers.length; t++) {
    const tier = tiers[t];
    const rounds = t === 0 ? 2 : 1;
    for (let r = 0; r < rounds; r++) {
      for (let m = 0; m < tier.urls.length; m++) {
        if (my !== session) return;
        const u = tier.urls[m]; // строка или { url, hls } — внутри одного качества бывают и обычные потоки, и HLS
        const c = await connect(u.url ?? u, !!(u.hls ?? tier.hls), my);
        if (my !== session) { if (c) release(c); return; }
        if (c) return onConnected(st, tier, c, my, kbps, t > 0 ? `backup:${tier.kbps}` : null);
        if (m + 1 < tier.urls.length) report({ notice: 'mirror' });
      }
      if (r + 1 < rounds) { report({ notice: 'reconnect' }); await sleep(1500); }
    }
    if (t + 1 < tiers.length) report({ notice: `lower:${tiers[t + 1].kbps}`, kbps: tiers[t + 1].kbps });
  }
  if (my === session) report({ status: 'error', notice: null });
}

async function onConnected(st, tier, c, my, wanted, notice) {
  current = c;
  const viz = await attachAnalyser(c);
  if (my !== session) return;
  rampIn(c);
  let stalls = 0;
  c.audio.addEventListener('waiting', () => report({ stalls: ++stalls })); // счётчик заиканий (для диагностики)
  report({ status: 'playing', kbps: tier.kbps, notice, viz, stalls, codec: codecOf(c) });
  setMedia(st, tier, null);
  pollTrack(st, tier);
  trackTimer = setInterval(() => pollTrack(st, tier), 15000);

  // сторож: если звук завис или поток оборвался — запускаем заново
  let lastTime = c.audio.currentTime, lastMove = Date.now();
  watchdog = setInterval(() => {
    if (my !== session) return;
    const now = c.audio.currentTime;
    if (now !== lastTime) { lastTime = now; lastMove = Date.now(); if (!c.audio.paused) report({ status: 'playing' }); return; }
    if (Date.now() - lastMove > 3000) report({ status: 'loading' });
    if (Date.now() - lastMove > STALL_MS || c.audio.ended || c.audio.error) start(st.id, wanted);
  }, 1500);
}

async function pollTrack(st, tier) {
  const my = session;
  const title = await fetchTrack(st.id).catch(() => null);
  if (my === session && title) { report({ track: title }); setMedia(st, tier, title); } // во время джингла оставляем предыдущую песню
}

/* ---------- визуализатор: отдаём уровни окну расширения, пока оно открыто ---------- */
function sendLevels() {
  if (!vizPort || !current?.analyser) return;
  const { analyser, data } = current;
  analyser.getByteFrequencyData(data);
  const out = new Array(BANDS);
  const top = Math.floor(data.length * 0.4);           // выше ~10 кГц почти тишина
  for (let i = 0; i < BANDS; i++) {
    const a = Math.floor(Math.pow(i / BANDS, 1.7) * top), b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / BANDS, 1.7) * top));
    let sum = 0;
    for (let k = a; k < b; k++) sum += data[k];
    out[i] = +(sum / (b - a) / 255).toFixed(3);
  }
  try { vizPort.postMessage(out); } catch { vizPort = null; }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'viz') return;
  vizPort = port;
  clearInterval(vizTimer);
  vizTimer = setInterval(sendLevels, 40);
  port.onDisconnect.addListener(() => { vizPort = null; clearInterval(vizTimer); });
});

/* ---------- команды от background ---------- */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== 'offscreen') return;
  if (msg.cmd === 'play') { volume = msg.volume; prebuffer = msg.prebuffer ?? PREBUFFER_S; fadeOn = msg.fade !== false; start(msg.id, msg.kbps); }
  else if (msg.cmd === 'stop') {
    session++; ms.playbackState = 'none'; ms.metadata = null;
    const c = current;
    fadeOutCurrent().then(() => { if (current === c) dispose(); });
  }
  else if (msg.cmd === 'volume') { volume = msg.volume; if (current) current.audio.volume = volume; }
});
