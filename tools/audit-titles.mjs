// Аудит названий песен: у каких станций без источника в nowplaying.js название можно прочитать прямо из потока (ICY)
// так, как это сделает расширение: запрос с Icy-MetaData из chrome-extension://, с учётом CORS и host_permissions.
//   node tools/audit-titles.mjs [--ids a,b] [--out файл.json]
// Результат: для каждой станции ok / причина отказа и пример названия.
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { STATIONS } = await import(pathToFileURL(path.join(root, 'stations.js')).href);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const permHosts = (manifest.host_permissions ?? []).map((p) => p.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^\*\./, ''));
const hasPerm = (h) => permHosts.some((p) => h === p || h.endsWith('.' + p));

const src = fs.readFileSync(path.join(root, 'nowplaying.js'), 'utf8');
const block = src.slice(src.indexOf('const SOURCES = {'), src.indexOf('};', src.indexOf('const SOURCES = {')));
const have = new Set([...block.matchAll(/^\s{2}([\w-]+)\s*[:,]/gm)].map((m) => m[1]));

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const only = arg('--ids')?.split(',');
const ORIGIN = 'chrome-extension://velvetradioaudit';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lc = (h, k) => (h.get(k) ?? '').toLowerCase();

async function readIcy(url) {
  const host = new URL(url).hostname;
  const perm = hasPerm(host);
  // 1. предзапрос CORS: заголовок Icy-MetaData делает запрос «непростым»
  if (!perm) {
    try {
      const o = await fetch(url, { method: 'OPTIONS', headers: { 'User-Agent': UA, Origin: ORIGIN, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'icy-metadata' }, signal: AbortSignal.timeout(8000) });
      const allow = lc(o.headers, 'access-control-allow-headers');
      const ao = o.headers.get('access-control-allow-origin');
      if (!o.ok || !(allow.includes('icy-metadata') || allow.trim() === '*') || !(ao === '*' || ao === ORIGIN)) return { why: 'CORS: предзапрос не пропускает Icy-MetaData' };
    } catch (e) { return { why: 'предзапрос: ' + (e.cause?.code ?? e.message) }; }
  }
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Origin: ORIGIN, 'Icy-MetaData': '1' }, signal: ctrl.signal });
    if (!r.ok) return { why: 'HTTP ' + r.status };
    if (!perm) {
      const ao = r.headers.get('access-control-allow-origin');
      if (!(ao === '*' || ao === ORIGIN)) return { why: 'CORS: нет Access-Control-Allow-Origin' };
      const ex = lc(r.headers, 'access-control-expose-headers');
      if (!(ex.includes('icy-metaint') || ex.trim() === '*')) return { why: 'CORS: icy-metaint не открыт (Expose-Headers)' };
    }
    const every = +r.headers.get('icy-metaint');
    if (!every) return { why: 'сервер не отдаёт метаданные (нет icy-metaint)' };
    const reader = r.body.getReader();
    let buf = new Uint8Array(0);
    const need = () => (buf.length > every ? every + 1 + buf[every] * 16 : every + 1);
    while (buf.length < need()) {
      const { value, done } = await reader.read();
      if (done) return { why: 'поток закончился' };
      const next = new Uint8Array(buf.length + value.length); next.set(buf); next.set(value, buf.length); buf = next;
    }
    const m = /StreamTitle='(.*?)';/s.exec(new TextDecoder().decode(buf.subarray(every + 1, need())));
    const title = m?.[1].trim();
    return title ? { ok: true, title, perm } : { ok: true, title: '(пусто в момент проверки)', perm, empty: true };
  } catch (e) { return { why: 'чтение: ' + (e.cause?.code ?? e.message) }; } finally { clearTimeout(timer); ctrl.abort(); }
}

const todo = STATIONS.filter((s) => !have.has(s.id) && (!only || only.includes(s.id)));
const res = {};
let i = 0;
await Promise.all(Array.from({ length: +(arg('--conc') ?? 5) }, async () => {
  while (i < todo.length) {
    const s = todo[i++];
    const urls = [...s.qualities].reverse().flatMap((q) => q.urls.map((u) => (typeof u === 'string' ? { url: u } : u)).filter((u) => !u.hls && !/\.m3u8/.test(u.url)).map((u) => u.url));
    let best = { why: 'нет прямого потока (только HLS)' };
    for (const u of [...new Set(urls)].slice(0, 4)) {
      const r = await readIcy(u); await sleep(150);
      if (r.ok) { best = { ...r, url: u }; break; }
      best = { ...r, url: u };
    }
    res[s.id] = best;
    console.log(best.ok ? (best.empty ? 'ПУСТО ' : 'OK    ') : 'нет   ', s.id.padEnd(22), best.ok ? best.title.slice(0, 60) : best.why);
  }
}));
const ok = Object.values(res).filter((r) => r.ok).length;
console.log(`
без источника сейчас: ${todo.length}; читается из потока: ${ok}; не читается: ${todo.length - ok}; уже с источником: ${have.size}`);
const out = arg('--out'); if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
// --write: дописать найденные адреса в icy-sources.js (генерируемый файл: id станции → поток, из которого читаем название)
if (process.argv.includes('--write')) {
  const file = path.join(root, 'icy-sources.js');
  const old = fs.existsSync(file) ? Object.fromEntries([...fs.readFileSync(file, 'utf8').matchAll(/^\s+'([\w-]+)': '([^']+)',$/gm)].map((m) => [m[1], m[2]])) : {};
  for (const [id, r] of Object.entries(res)) if (r.ok) old[id] = r.url;
  const body = Object.entries(old).sort(([a], [b]) => a.localeCompare(b)).map(([id, u]) => `  '${id}': '${u}',`).join('\n');
  fs.writeFileSync(file, '// ГЕНЕРИРУЕТСЯ: node tools/audit-titles.mjs --write. Станции, у которых название песни читается прямо из потока (ICY, сервер разрешает CORS).\nexport const ICY_SOURCES = {\n' + body + '\n};\n');
  console.log('записано в icy-sources.js:', Object.keys(old).length);
}
