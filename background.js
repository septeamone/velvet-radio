import { STATIONS, maxKbps, sortByOrder, pickKbps, stationsOf } from './stations.js';

const index = new Map(STATIONS.map((s) => [s.id, s]));
const byId = (id) => index.get(id);
const DEFAULT = { stationId: null, kbps: null, status: 'stopped', volume: 0.8, track: null, notice: null, viz: false };

async function getState() {
  const { state } = await chrome.storage.session.get('state');
  if (state) return state;
  const { volume } = await chrome.storage.local.get('volume');
  return { ...DEFAULT, volume: volume ?? DEFAULT.volume };
}

// Записи состояния идут строго по очереди: иначе два быстрых сообщения затирают друг друга.
let queue = Promise.resolve();
function setState(patch, { onlyIfActive = false } = {}) {
  const job = async () => {
    const cur = await getState();
    if (onlyIfActive && cur.status === 'stopped') return cur; // станцию уже остановили — запоздавший отчёт не нужен
    const next = { ...cur, ...patch };
    await chrome.storage.session.set({ state: next });
    await renderAction(next);
    chrome.runtime.sendMessage({ type: 'state', state: next }).catch(() => {});
    return next;
  };
  return (queue = queue.then(job, job));
}

async function renderAction(state) {
  const station = byId(state.stationId);
  const on = state.status === 'playing' || state.status === 'loading';
  const name = on ? 'on' : 'idle';
  const path = { 16: `icons/${name}16.png`, 32: `icons/${name}32.png`, 48: `icons/${name}48.png`, 128: `icons/${name}128.png` };
  const text = { playing: 'ON', loading: '…', error: '!' }[state.status] ?? '';
  const title = on && station ? `${station.name}${state.track ? ` — ${state.track}` : ''}` : 'Velvet Radio';
  await chrome.action.setIcon({ path });
  await chrome.action.setBadgeBackgroundColor({ color: state.status === 'error' ? '#d64545' : '#ff5e78' });
  await chrome.action.setBadgeText({ text });
  await chrome.action.setTitle({ title });
}

async function ensureOffscreen() {
  const ctx = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (ctx.length) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Воспроизведение радио в фоне',
  });
}

async function play(id, kbps) {
  const station = byId(id);
  if (!station) return;
  await ensureOffscreen();
  const { volume } = await getState();
  const { settings = {} } = await chrome.storage.local.get('settings');
  const want = kbps ?? maxKbps(station);
  await setState({ stationId: id, kbps: want, status: 'loading', track: null, notice: null, viz: false, codec: null });
  chrome.runtime.sendMessage({ target: 'offscreen', cmd: 'play', id, kbps: want, volume, prebuffer: [4, 8, 12].includes(settings.buffer) ? settings.buffer : 4, fade: settings.fade !== false }).catch(() => {});
}

async function stop() {
  chrome.runtime.sendMessage({ target: 'offscreen', cmd: 'stop' }).catch(() => {});
  await setState({ status: 'stopped', track: null, notice: null, viz: false });
}

/* ---------- горячие клавиши и медиа-кнопки (клавиатура, наушники, оверлей Windows) ---------- */
async function playSaved(id) {
  const { quality, settings } = await chrome.storage.local.get(['quality', 'settings']);
  await play(id, pickKbps(byId(id), quality?.[id], !!settings?.saver));
}

async function toggle() {
  const st = await getState();
  if (st.status !== 'stopped' && st.status !== 'error') return stop();
  const { last, order } = await chrome.storage.local.get(['last', 'order']);
  await playSaved(st.stationId ?? last ?? sortByOrder(order)[0].id);
}

async function step(dir) { // «следующая / предыдущая» ходит по станциям той же страны, что играет сейчас
  const { order } = await chrome.storage.local.get('order');
  const st = await getState();
  const list = sortByOrder(order, stationsOf(byId(st.stationId)?.country ?? 'RU'));
  const cur = list.findIndex((s) => s.id === st.stationId);
  await playSaved(list[(cur < 0 ? (dir > 0 ? 0 : list.length - 1) : cur + dir + list.length) % list.length].id);
}

chrome.commands.onCommand.addListener((cmd) => ({ toggle, next: () => step(1), prev: () => step(-1) })[cmd]?.());

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target) return; // сообщения для offscreen
  (async () => {
    switch (msg.type) {
      case 'play': await play(msg.id, msg.kbps); break;
      case 'stop': await stop(); break;
      case 'volume':
        await chrome.storage.local.set({ volume: msg.value });
        await setState({ volume: msg.value });
        chrome.runtime.sendMessage({ target: 'offscreen', cmd: 'volume', volume: msg.value }).catch(() => {});
        break;
      case 'media': // кнопки мультимедиа из offscreen (MediaSession)
        if (msg.action === 'play') { if (['stopped', 'error'].includes((await getState()).status)) await toggle(); }
        else if (msg.action === 'pause') await stop();
        else if (msg.action === 'next') await step(1);
        else if (msg.action === 'previous') await step(-1);
        break;
      case 'status': // от offscreen
        await setState(msg.patch, { onlyIfActive: true });
        break;
    }
    sendResponse(await getState());
  })();
  return true;
});

// После перезапуска браузера звука уже нет — сбрасываем состояние.
chrome.runtime.onStartup.addListener(async () => {
  await setState({ status: 'stopped', track: null, notice: null, viz: false });
  const { settings, last } = await chrome.storage.local.get(['settings', 'last']);
  if (settings?.resume && byId(last)) await playSaved(last);   // «играть при запуске Chrome» (по настройке)
});
chrome.runtime.onInstalled.addListener(() => renderAction(DEFAULT));
