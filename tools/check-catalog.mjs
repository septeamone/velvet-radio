// Проверка каталога: схема (быстро, без сети) и, по желанию, живые адреса.
//   node tools/check-catalog.mjs               только схема: id, жанры, качества, логотипы, дубли
//   node tools/check-catalog.mjs --live        плюс проверка всех адресов probe (аудио живое? кодек, CORS); основа самодиагностики
//   node tools/check-catalog.mjs --live --ids a,b   только эти станции
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { probeMany } from './probe.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { STATIONS, GENRES, COUNTRIES, shown } = await import(pathToFileURL(path.join(root, 'stations.js')).href);
const live = process.argv.includes('--live');
const onlyArg = process.argv.indexOf('--ids');
const only = onlyArg > 0 ? process.argv[onlyArg + 1].split(',') : null;

let errors = 0, warns = 0;
const err = (s, m) => { errors++; console.log(`ОШИБКА ${s.id}: ${m}`); };
const warn = (s, m) => { warns++; console.log(`  предупр. ${s.id}: ${m}`); };
const ids = new Set(), urlOwner = new Map();
const ccs = new Set(COUNTRIES.map((c) => c.cc).concat('RU'));

for (const s of STATIONS) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id ?? '')) err(s, 'плохой id');
  if (ids.has(s.id)) err(s, 'id повторяется'); ids.add(s.id);
  if (!s.name?.trim()) err(s, 'нет названия');
  if (!ccs.has(s.country)) err(s, `неизвестная страна ${s.country}`);
  if (s.country !== 'RU' && !s.id.startsWith(s.country.toLowerCase() + '-') && s.id !== 'bbc1xtra') warn(s, 'id без префикса страны');
  if (typeof s.genre === 'string' ? !GENRES[s.genre] : !(s.genre?.ru && s.genre?.en)) err(s, `жанр не из списка: ${JSON.stringify(s.genre)}`);
  if (!s.mark || s.mark.length > 3) err(s, 'mark должен быть 1–3 символа');
  if (!(s.hue >= 0 && s.hue <= 360)) err(s, 'hue 0–360');
  const qs = s.qualities ?? [];
  if (!qs.length) { err(s, 'нет качеств'); continue; }
  for (let i = 1; i < qs.length; i++) if (qs[i].kbps < qs[i - 1].kbps) err(s, 'качества не по возрастанию');
  const vis = qs.filter((q) => !q.hide);
  if (!vis.length) err(s, 'нет видимого качества');
  if (vis.length > 3) err(s, `кнопок качества ${vis.length} (максимум три)`);
  if (vis.some((q) => q.kbps <= 64)) err(s, '64 kbps на кнопке запрещено');
  else if (vis.at(-1) && vis.at(-1).kbps < 128) warn(s, `выше ${vis.at(-1).kbps} kbps ничего нет (допустимо только когда выше правда нет)`);
  if (vis.some((q) => q.kbps < 128) && vis.some((q) => q.kbps >= 128)) warn(s, 'на кнопках есть <128 рядом с ≥128, сделать hid()');
  if (qs.some((q) => q.hide && q.kbps <= 64)) warn(s, 'скрытое 64 kbps допустимо только в крайнем случае');
  for (const q of qs) {
    if (!q.urls?.length) err(s, `качество ${q.kbps}: нет адресов`);
    for (const u of q.urls ?? []) {
      const url = u.url ?? u;
      if (!/^https?:\/\//.test(url)) err(s, `качество ${q.kbps}: плохой адрес ${url}`);
      if (/token=|signature=|expires=|\bsig=/i.test(url)) warn(s, `адрес с токеном: ${url.slice(0, 60)}…`);
      const o = urlOwner.get(url); if (o && o !== s.id) warn(s, `адрес как у ${o}: ${url.slice(0, 70)}`); urlOwner.set(url, s.id);
    }
  }
  if (!fs.existsSync(path.join(root, 'logos', `${s.id}.png`))) warn(s, 'нет логотипа (покажется буква)');
}
const fl = COUNTRIES.filter((c) => !fs.existsSync(path.join(root, 'flags', `${c.cc.toLowerCase()}.svg`)));
if (fl.length) console.log('ОШИБКА нет флагов:', fl.map((c) => c.cc).join(', ')), errors++;

const byC = {}; for (const s of STATIONS) byC[s.country] = (byC[s.country] ?? 0) + 1;
console.log(`станций: ${STATIONS.length}; по странам: ${Object.entries(byC).map(([k, v]) => k + ' ' + v).join(', ')}`);

if (live) {
  const list = STATIONS.filter((s) => !only || only.includes(s.id));
  const jobs = list.flatMap((s) => s.qualities.flatMap((q) => q.urls.map((u) => ({ s, q, url: u.url ?? u, hls: !!(u.hls ?? q.hls) }))));
  console.log(`живая проверка: ${jobs.length} адресов…`);
  const res = await probeMany(jobs.map((j) => ({ url: j.url, hls: j.hls })), { concurrency: 6, pause: 120 });
  const dead = [];
  res.forEach((r, i) => { if (!r.ok) dead.push([jobs[i], r]); });
  // качество «мертво» только если не отвечает ни один адрес
  const per = new Map();
  jobs.forEach((j, i) => { const k = j.s.id + '|' + j.q.kbps; const e = per.get(k) ?? { s: j.s, q: j.q, ok: 0, n: 0 }; e.n++; if (res[i].ok) e.ok++; per.set(k, e); });
  for (const e of per.values()) {
    if (e.ok === 0) { errors++; console.log(`МЁРТВО ${e.s.id} ${e.q.kbps}k: не отвечает ни один из ${e.n} адресов`); }
    else if (e.ok < e.n) { warns++; console.log(`  часть адресов не отвечает ${e.s.id} ${e.q.kbps}k: ${e.ok}/${e.n}`); }
  }
  console.log(`адресов живых: ${res.length - dead.length}/${res.length}`);
}
console.log(`\nошибок: ${errors}, предупреждений: ${warns}`);
process.exit(errors ? 1 : 0);
