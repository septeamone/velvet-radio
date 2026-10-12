// Собирает stations.js из файлов stations/*.js (по файлу на страну; Россия — ru*.js).
// Запуск после добавления или удаления файла страны: node tools/gen-catalog.mjs
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'stations');
const skip = new Set(['lib.js', 'genres.js', 'countries.js']);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !skip.has(f)).sort();
const { COUNTRIES } = await import(pathToFileURL(path.join(dir, 'countries.js')).href);
const order = ['RU', ...COUNTRIES.map((c) => c.cc)];
const ccOf = (f) => (f.startsWith('ru') ? 'RU' : f.slice(0, 2).toUpperCase());
files.sort((a, b) => order.indexOf(ccOf(a)) - order.indexOf(ccOf(b)) || a.slice(0, -3).localeCompare(b.slice(0, -3)));
for (const f of files) if (!order.includes(ccOf(f))) console.warn('! файл с неизвестной страной:', f);

const names = files.map((f, i) => `S${i}`);
const out = `// ГЕНЕРИРУЕТСЯ: node tools/gen-catalog.mjs — собирает станции из stations/*.js. Руками правь файлы в stations/, не этот.
${files.map((f, i) => `import ${names[i]} from './stations/${f}';`).join('\n')}
export { GENRES } from './stations/genres.js';
export { COUNTRIES } from './stations/countries.js';

export const STATIONS = [${names.map((n) => '...' + n).join(', ')}];

export const shown = (s) => { const v = s.qualities.filter((x) => !x.hide); return v.length ? v : s.qualities.slice(-1); };
export const maxKbps = (s) => shown(s).at(-1).kbps;

// Пользовательский порядок станций (ids из хранилища); новые станции — в конец.
export const sortByOrder = (ids = [], list = STATIONS) => {
  const pos = new Map(ids.map((id, i) => [id, i]));
  const rank = (s) => pos.get(s.id) ?? 1000 + STATIONS.indexOf(s);
  return [...list].sort((a, b) => rank(a) - rank(b));
};
// Сохранённое качество могло устареть — тогда берём лучшее из доступных.
export const pickKbps = (s, wanted, saver = false) => (shown(s).some((q) => q.kbps === wanted) ? wanted : saver ? shown(s)[0].kbps : maxKbps(s));
export const stationsOf = (cc) => STATIONS.filter((s) => s.country === cc);
`;
fs.writeFileSync(path.join(root, 'stations.js'), out);
console.log('stations.js:', files.join(', '));
