// Настройки, резервная копия, синхронизация между компьютерами и проверка станций. Только данные, разрешений не требует.
import { STATIONS, shown } from './stations.js';

export const DEFAULTS = { saver: false, buffer: 4, fade: true, resume: false, sync: false };
export const getSettings = async () => ({ ...DEFAULTS, ...((await chrome.storage.local.get('settings')).settings ?? {}) });
export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ settings: next });
  if (next.sync) pushSync().catch(() => {});
  return next;
}

/* ---------- резервная копия ---------- */
const KEYS = ['favs', 'order', 'quality', 'lang', 'theme', 'view', 'settings', 'last'];

export async function exportBackup() {
  const data = await chrome.storage.local.get(KEYS);
  return { app: 'velvet-radio', version: chrome.runtime.getManifest().version, date: new Date().toISOString(), data };
}

export async function importBackup(obj) {
  if (obj?.app !== 'velvet-radio' || typeof obj.data !== 'object') throw new Error('bad');
  const ids = new Set(STATIONS.map((s) => s.id)), d = obj.data, out = {};
  if (Array.isArray(d.favs)) out.favs = d.favs.filter((id) => ids.has(id));
  if (Array.isArray(d.order)) out.order = d.order.filter((id) => ids.has(id));
  if (d.quality && typeof d.quality === 'object') out.quality = Object.fromEntries(Object.entries(d.quality).filter(([id, k]) => ids.has(id) && Number.isFinite(k)));
  if (['ru', 'en'].includes(d.lang)) out.lang = d.lang;
  if (['light', 'dark'].includes(d.theme)) out.theme = d.theme;
  if (['list', 'tiles'].includes(d.view)) out.view = d.view;
  if (typeof d.last === 'string' && ids.has(d.last)) out.last = d.last;
  if (d.settings && typeof d.settings === 'object') out.settings = { ...DEFAULTS, ...Object.fromEntries(Object.entries(d.settings).filter(([k]) => k in DEFAULTS)) };
  await chrome.storage.local.set(out);
  return Object.keys(out).length;
}

/* ---------- синхронизация через аккаунт Chrome (лимит sync: 8 КБ на ключ — избранное, порядок и качество влезают с запасом) ---------- */
const SYNC_KEYS = ['favs', 'order', 'quality', 'lang', 'theme', 'view'];
export async function pushSync() {
  const data = await chrome.storage.local.get(SYNC_KEYS);
  await chrome.storage.sync.set({ ...data, syncedAt: Date.now() });
  await chrome.storage.local.set({ syncedAt: Date.now() });
}
// Возвращает true, если из облака пришли более свежие данные (окно тогда перечитывает хранилище).
export async function pullSync() {
  const [remote, local] = await Promise.all([chrome.storage.sync.get(null), chrome.storage.local.get('syncedAt')]);
  if (!remote.syncedAt || remote.syncedAt <= (local.syncedAt ?? 0)) return false;
  const patch = Object.fromEntries(SYNC_KEYS.filter((k) => remote[k] !== undefined).map((k) => [k, remote[k]]));
  await chrome.storage.local.set({ ...patch, syncedAt: remote.syncedAt });
  return true;
}

/* ---------- проверка станций: отвечают ли адреса настоящим аудио (а не заглушкой / HTML / ошибкой) ---------- */
async function checkUrl(url, hls) {
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) return 'bad';
    const ct = r.headers.get('content-type') ?? '';
    if (/text\/html/i.test(ct)) return 'bad';
    if (hls) return (await r.text()).startsWith('#EXTM3U') ? 'ok' : 'bad';
    return 'ok';
  } catch { return 'unknown'; }          // нет CORS или сеть: достоверно сказать нельзя
  finally { clearTimeout(timer); ctrl.abort(); }
}

async function checkStation(s, kbps) {
  const tier = shown(s).find((q) => q.kbps === kbps) ?? shown(s).at(-1);
  const res = await Promise.all(tier.urls.map((u) => checkUrl(u.url ?? u, !!(u.hls ?? tier.hls))));
  return res.includes('ok') ? 'ok' : res.includes('unknown') ? 'unknown' : 'bad';
}

export async function checkStations(list, quality = {}, onProgress) {
  const bad = []; let done = 0, i = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (i < list.length) {
      const s = list[i++];
      if (await checkStation(s, quality[s.id]) === 'bad') bad.push(s.id);
      onProgress?.(++done, list.length);
    }
  }));
  const health = { t: Date.now(), n: list.length, bad };
  await chrome.storage.local.set({ health });
  return health;
}
