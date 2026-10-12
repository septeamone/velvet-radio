// Проверка потока: отвечает ли адрес настоящим аудио (а не заглушкой / 404 / HTML). Битрейт НЕ замеряем:
// «заявленный» берём из icy-br, адреса или каталога (правила: ADDING-STATIONS.md).
//
//   node tools/probe.mjs <url> [<url>...]            проверить адреса (HLS определяется по .m3u8)
//   node tools/probe.mjs --rb "название" [--cc RU]   найти кандидатов в radio-browser.info и проверить их
//   node tools/probe.mjs --json ...                  вывод в JSON (для скриптов)
import { pathToFileURL } from 'node:url';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const ORIGIN = 'chrome-extension://velvetradioprobe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sniff(b) {
  if (b.length < 4) return null;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return 'MP3'; // ID3
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return 'AAC';        // ADTS
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return 'MP3';        // кадр MPEG
  if (b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) return 'OGG';
  if (b[0] === 0x66 && b[1] === 0x4c && b[2] === 0x61 && b[3] === 0x43) return 'FLAC';
  if (b[0] === 0x47) return 'TS';
  return null;
}
const cors = (h) => { const v = h.get('access-control-allow-origin'); return v === '*' ? '*' : v === ORIGIN ? 'echo' : null; };

async function readSome(res, bytes, ms) {
  const reader = res.body.getReader();
  const chunks = []; let n = 0; const t0 = Date.now();
  while (n < bytes && Date.now() - t0 < ms) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value); n += value.length;
  }
  reader.cancel().catch(() => {});
  const out = new Uint8Array(n); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

async function get(url, { ms = 9000, headers = {} } = {}) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), ms);
  try { return { res: await fetch(url, { headers: { 'User-Agent': UA, Origin: ORIGIN, ...headers }, signal: ctrl.signal, redirect: 'follow' }), ctrl, timer }; }
  catch (e) { clearTimeout(timer); throw e; }
}

async function probeStream(url) {
  const t0 = Date.now();
  let ctrl, timer;
  try {
    const got = await get(url, { headers: { 'Icy-MetaData': '1' } });
    const res = got.res; ({ ctrl, timer } = got);
    const ct = res.headers.get('content-type') ?? '';
    const r = { url, ok: false, status: res.status, ct, icyBr: +res.headers.get('icy-br') || null, icyName: res.headers.get('icy-name'), cors: cors(res.headers), ms: Date.now() - t0 };
    if (!res.ok) return r;
    if (/text\/html|json|xml/i.test(ct)) { r.error = 'не аудио: ' + ct; return r; }
    const head = await readSome(res, 24000, 6000);
    r.bytes = head.length;
    r.codec = sniff(head) ?? (/mpeg/i.test(ct) ? 'MP3' : /aac/i.test(ct) ? 'AAC' : /ogg/i.test(ct) ? 'OGG' : null);
    r.ok = head.length >= 8000 && !!r.codec;
    if (!r.ok) r.error = head.length < 8000 ? `мало данных (${head.length} Б)` : 'формат не распознан';
    return r;
  } catch (e) { return { url, ok: false, error: String(e.cause?.code ?? e.message ?? e) }; }
  finally { clearTimeout(timer); ctrl?.abort(); }
}

async function probeHls(url) {
  const t0 = Date.now();
  try {
    const { res, timer } = await get(url);
    clearTimeout(timer);
    const r = { url, hls: true, ok: false, status: res.status, cors: cors(res.headers), ms: Date.now() - t0 };
    if (!res.ok) return r;
    const text = await res.text();
    if (!text.startsWith('#EXTM3U')) { r.error = 'не плейлист'; return r; }
    const lines = text.split(/\r?\n/);
    const variants = [];
    for (let i = 0; i < lines.length; i++) {
      const m = /BANDWIDTH=(\d+)/.exec(lines[i]);
      if (lines[i].startsWith('#EXT-X-STREAM-INF') && m && lines[i + 1]) variants.push({ kbps: Math.round(+m[1] / 1000), uri: new URL(lines[i + 1], url).href });
    }
    r.variants = variants.map((v) => v.kbps);
    let media = url, mediaText = text;
    if (variants.length) { // берём самый «толстый» вариант
      const best = variants.sort((a, b) => b.kbps - a.kbps)[0];
      const sub = await get(best.uri); clearTimeout(sub.timer);
      if (!sub.res.ok) { r.error = 'вариант: HTTP ' + sub.res.status; return r; }
      media = best.uri; mediaText = await sub.res.text();
    }
    const seg = mediaText.split(/\r?\n/).find((l) => l && !l.startsWith('#'));
    if (!seg) { r.error = 'нет сегментов'; return r; }
    const s = await get(new URL(seg, media).href); clearTimeout(s.timer);
    if (!s.res.ok) { r.error = 'сегмент: HTTP ' + s.res.status; return r; }
    const data = new Uint8Array(await s.res.arrayBuffer());
    r.bytes = data.length;
    r.codec = sniff(data) ?? 'HLS';
    r.ok = data.length > 2000;
    if (!r.ok) r.error = 'пустой сегмент';
    return r;
  } catch (e) { return { url, hls: true, ok: false, error: String(e.cause?.code ?? e.message ?? e) }; }
}

export const probe = (url, hls = /\.m3u8(\?|$)/i.test(url)) => (hls ? probeHls(url) : probeStream(url));

// Пул с паузами, чтобы не получать 429
export async function probeMany(urls, { concurrency = 4, pause = 150 } = {}) {
  const out = new Array(urls.length); let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < urls.length) { const k = i++; const u = urls[k]; out[k] = await probe(u.url ?? u, u.hls); await sleep(pause); }
  }));
  return out;
}

export async function radioBrowser(name, cc) {
  const q = new URLSearchParams({ name, limit: '40', hidebroken: 'true', order: 'votes', reverse: 'true' });
  if (cc) q.set('countrycode', cc);
  for (const host of ['de1', 'de2', 'nl1', 'fi1']) {
    try { const r = await fetch(`https://${host}.api.radio-browser.info/json/stations/search?${q}`, { headers: { 'User-Agent': 'VelvetRadio-tools' }, signal: AbortSignal.timeout(15000) }); if (r.ok) return r.json(); } catch { /* следующий сервер */ }
  }
  return [];
}

const fmt = (r) => `${r.ok ? 'OK  ' : 'FAIL'} ${r.codec ?? '-'} ${r.icyBr ? r.icyBr + 'k' : r.variants ? 'hls[' + r.variants.join('/') + ']' : '-'} cors:${r.cors ?? 'нет'} ${r.error ?? ''} ${r.url}`;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2); const json = a.includes('--json');
  const flag = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; };
  let urls = a.filter((x) => /^https?:/i.test(x));
  const rb = flag('--rb');
  if (rb) {
    const list = await radioBrowser(rb, flag('--cc'));
    if (!json) for (const s of list) console.log(`# ${s.bitrate}k ${s.codec} ${s.countrycode} votes:${s.votes} ${s.name} | ${s.homepage}`);
    urls = list.map((s) => s.url_resolved).filter(Boolean);
  }
  const res = await probeMany(urls);
  if (json) console.log(JSON.stringify(res, null, 1)); else res.forEach((r) => console.log(fmt(r)));
}
