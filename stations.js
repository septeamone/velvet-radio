// ГЕНЕРИРУЕТСЯ: node tools/gen-catalog.mjs — собирает станции из stations/*.js. Руками правь файлы в stations/, не этот.
import S0 from './stations/ru.js';
import S1 from './stations/gb-base.js';
export { GENRES } from './stations/genres.js';
export { COUNTRIES } from './stations/countries.js';

export const STATIONS = [...S0, ...S1];

export const shown = (s) => { const v = s.qualities.filter((x) => !x.hide); return v.length ? v : s.qualities.slice(-1); };
export const maxKbps = (s) => shown(s).at(-1).kbps;

// Пользовательский порядок станций (ids из хранилища); новые станции — в конец.
export const sortByOrder = (ids = [], list = STATIONS) => {
  const pos = new Map(ids.map((id, i) => [id, i]));
  const rank = (s) => pos.get(s.id) ?? 1000 + STATIONS.indexOf(s);
  return [...list].sort((a, b) => rank(a) - rank(b));
};
// Сохранённое качество могло устареть — тогда берём лучшее из доступных.
export const pickKbps = (s, wanted) => (shown(s).some((q) => q.kbps === wanted) ? wanted : maxKbps(s));
export const stationsOf = (cc) => STATIONS.filter((s) => s.country === cc);
