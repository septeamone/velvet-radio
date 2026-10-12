// Два языка интерфейса (русский / английский). Язык по умолчанию — по языку браузера, переключатель в шапке окна.
import { GENRES, COUNTRIES } from './stations.js';

const STR = {
  ru: {
    search: 'Поиск станции', searchCountries: 'Поиск страны или станции',
    tabRussia: 'Россия', tabFav: 'Избранное', tabCountries: 'Страны',
    pick: 'Выберите станцию', pickHint: 'Нажмите на любую из списка',
    retry: 'Повторить', playPause: 'Играть / пауза', volume: 'Громкость', theme: 'Сменить тему',
    telegram: 'Мой Telegram', language: 'Язык: русский', favAdd: 'В избранное', quality: 'Качество',
    emptyFav: 'Пока пусто — нажмите на сердечко у станции', nothing: 'Ничего не найдено',
    unavailable: 'Станция недоступна', connecting: 'Подключение…', playingAt: 'Играет · {k} kbps',
    googleIt: 'Найти эту песню в Google', back: 'Назад', viewList: 'Список', viewTiles: 'Плитки', countriesLabel: 'Страны',
    stationsFound: 'Станции',
    n_mirror: 'Пробую резервный поток…', n_reconnect: 'Переподключение…', n_lower: 'Снижаю качество до {k} kbps…', n_backup: 'Резервное качество · {k} kbps',
    one: 'станция', few: 'станции', many: 'станций', other: 'станций',
  },
  en: {
    search: 'Search stations', searchCountries: 'Search country or station',
    tabRussia: 'Russia', tabFav: 'Favorites', tabCountries: 'Countries',
    pick: 'Pick a station', pickHint: 'Tap any station in the list',
    retry: 'Retry', playPause: 'Play / pause', volume: 'Volume', theme: 'Toggle theme',
    telegram: 'My Telegram', language: 'Language: English', favAdd: 'Add to favorites', quality: 'Quality',
    emptyFav: 'Nothing here yet — tap the heart on a station', nothing: 'Nothing found',
    unavailable: 'Station unavailable', connecting: 'Connecting…', playingAt: 'Playing · {k} kbps',
    googleIt: 'Search this song on Google', back: 'Back', viewList: 'List', viewTiles: 'Tiles', countriesLabel: 'Countries',
    stationsFound: 'Stations',
    n_mirror: 'Trying a backup stream…', n_reconnect: 'Reconnecting…', n_lower: 'Lowering quality to {k} kbps…', n_backup: 'Backup quality · {k} kbps',
    one: 'station', other: 'stations',
  },
};

let lang = 'ru';
const CIS = ['ru', 'uk', 'be', 'kk', 'uz', 'hy', 'az', 'ka'];
export const detectLang = () => (CIS.includes((navigator.language || 'en').slice(0, 2).toLowerCase()) ? 'ru' : 'en');
export const setLang = (l) => { lang = STR[l] ? l : 'ru'; document.documentElement.lang = lang; names = null; };
export const getLang = () => lang;

export const t = (key, vars) => (STR[lang][key] ?? STR.ru[key] ?? key).replace(/\{(\w+)\}/g, (_m, k) => vars?.[k] ?? '');

// «Пробую резервный поток…» приходит из offscreen как ключ: `mirror`, `lower:192`…
export const notice = (code) => { if (!code) return null; const [k, v] = code.split(':'); return t('n_' + k, { k: v }); };

const rules = () => new Intl.PluralRules(lang);
export const stationsWord = (n) => `${n} ${STR[lang][rules().select(n)] ?? STR[lang].other}`;

export const genreName = (g) => (typeof g === 'string' ? GENRES[g]?.[lang === 'ru' ? 0 : 1] ?? g : g[lang]);
export const genreAll = (g) => (typeof g === 'string' ? (GENRES[g] ?? [g]).join(' ') : `${g.ru} ${g.en}`);

/* ---------- страны: названия от браузера на обоих языках + псевдонимы для поиска ---------- */
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').trim();
let names = null;
const dn = { ru: new Intl.DisplayNames(['ru'], { type: 'region' }), en: new Intl.DisplayNames(['en'], { type: 'region' }) };
function build() {
  names = new Map();
  for (const c of COUNTRIES) {
    names.set(c.cc, { ru: dn.ru.of(c.cc), en: dn.en.of(c.cc), hay: norm([dn.ru.of(c.cc), dn.en.of(c.cc), c.cc, ...c.aliases].join(' ')) });
  }
}
export const countryName = (cc) => { if (!names) build(); return names.get(cc)?.[lang] ?? cc; };
export const countryMatches = (cc, q) => { if (!names) build(); const hay = names.get(cc)?.hay ?? ''; return norm(q).split(/\s+/).every((w) => hay.includes(w)); };
export const stationMatches = (s, q) => {
  const hay = norm(`${s.name} ${s.alt ?? ''} ${genreAll(s.genre)} ${s.country === 'RU' ? '' : `${dn.ru.of(s.country)} ${dn.en.of(s.country)}`}`);
  return norm(q).split(/\s+/).every((w) => hay.includes(w));
};
