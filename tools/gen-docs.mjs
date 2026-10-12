// Подставляет в документы актуальные цифры каталога и обновляет таблицу стран в README.
//   node tools/gen-docs.mjs
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { STATIONS, COUNTRIES } = await import(pathToFileURL(path.join(root, 'stations.js')).href);
const ru = new Intl.DisplayNames(['ru'], { type: 'region' });
const countries = new Set(STATIONS.map((s) => s.country).filter((c) => c !== 'RU'));
const N = Math.floor(STATIONS.length / 10) * 10;

const rows = [['RU', STATIONS.filter((s) => s.country === 'RU').length], ...COUNTRIES.map((c) => [c.cc, STATIONS.filter((s) => s.country === c.cc).length]).filter(([, n]) => n)];
const fixName = (cc) => ({ US: 'США', AE: 'ОАЭ' }[cc] ?? ru.of(cc));
const table = ['| Страна | Станций |', '|---|--:|', ...rows.map(([cc, n]) => `| ${fixName(cc)} | ${n} |`)].join('\n');
const top = (s) => Math.max(...s.qualities.filter((q) => !q.hide).map((q) => q.kbps));
const max320 = STATIONS.filter((s) => top(s) >= 320).length;

for (const f of ['ROADMAP.md', 'CHANGELOG.md', 'README.md']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  s = s.replaceAll('{{N}}', String(N)).replaceAll('{{C}}', String(countries.size)).replaceAll('{{TOTAL}}', String(STATIONS.length)).replaceAll('{{320}}', String(max320));
  s = s.replace(/<!-- countries:start -->[\s\S]*?<!-- countries:end -->/, `<!-- countries:start -->\n${table}\n<!-- countries:end -->`);
  fs.writeFileSync(p, s);
}
console.log(`станций ${STATIONS.length}, стран (кроме России) ${countries.size}, с качеством 320: ${max320}`);
