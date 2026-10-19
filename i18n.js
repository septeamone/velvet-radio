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
    settings: 'Настройки', genre: 'Жанр', genreAll: 'Все жанры', report: 'Сообщить о проблеме',
    sSaver: 'Экономия трафика', sSaverD: 'По умолчанию играть самое низкое качество',
    sViz: 'Визуализатор звука', sVizD: 'Волна под плеером. Выключите, чтобы плеер стал ниже и на экране помещалось больше станций',
    sClassic: 'Классический интерфейс', sClassicD: 'Прежний вид окна со стеклянными панелями',
    sFade: 'Плавные переходы', sFadeD: 'Прежняя станция играет, пока новая подключается, затем звук плавно перетекает',
    sResume: 'Играть при запуске Chrome', sResumeD: 'Продолжить последнюю станцию',
    sSync: 'Синхронизация', sSyncD: 'Избранное, порядок и качество между компьютерами через аккаунт Chrome',
    sBuffer: 'Ожидание перед стартом, секунд', sBufferD: 'Больше — реже заикается, но звук начинается позже',
    sBackup: 'Резервная копия', sBackupD: 'Избранное, порядок станций, качество, настройки', sExport: 'Сохранить', sImport: 'Загрузить',
    sImported: 'Копия загружена', sBadFile: 'Это не копия Velvet Radio',
    sCheck: 'Проверка станций', sCheckBtn: 'Проверить избранное', sChecking: 'Проверяю… {a}/{b}', sNeverChecked: 'Избранные и последняя станция, раз в сутки',
    sChecked: 'Проверено станций: {n}. Не отвечают: {p}', sAllOk: 'Проверено станций: {n}. Всё работает',
    sKeys: 'Горячие клавиши', sKeysD: 'Пауза, следующая и предыдущая станция', sKeysBtn: 'Настроить', sPrivacy: 'Конфиденциальность',
    badStation: 'Станция не отвечала при последней проверке',
    dotOk: 'Играет', dotWarn: 'Подключение или резервный поток', dotBad: 'Станция недоступна',
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
    settings: 'Settings', genre: 'Genre', genreAll: 'All genres', report: 'Report a problem',
    sSaver: 'Data saver', sSaverD: 'Play the lowest quality by default',
    sViz: 'Sound visualizer', sVizD: 'The wave under the player. Turn it off for a shorter player and more stations on screen',
    sClassic: 'Classic interface', sClassicD: 'The previous look with glass panels',
    sFade: 'Smooth transitions', sFadeD: 'The old station keeps playing while the new one connects, then the sound crossfades',
    sResume: 'Resume when Chrome starts', sResumeD: 'Continue the last station',
    sSync: 'Sync', sSyncD: 'Favorites, order and quality across computers via your Chrome account',
    sBuffer: 'Wait before playback, seconds', sBufferD: 'Longer means fewer stutters, but sound starts later',
    sBackup: 'Backup', sBackupD: 'Favorites, station order, quality, settings', sExport: 'Save', sImport: 'Load',
    sImported: 'Backup loaded', sBadFile: 'This is not a Velvet Radio backup',
    sCheck: 'Station check', sCheckBtn: 'Check favorites', sChecking: 'Checking… {a}/{b}', sNeverChecked: 'Favorites and the last station, once a day',
    sChecked: 'Stations checked: {n}. Not responding: {p}', sAllOk: 'Stations checked: {n}. All good',
    sKeys: 'Keyboard shortcuts', sKeysD: 'Pause, next and previous station', sKeysBtn: 'Customize', sPrivacy: 'Privacy',
    badStation: 'Station did not respond at the last check',
    dotOk: 'Playing', dotWarn: 'Connecting or backup stream', dotBad: 'Station unavailable',
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
    const shortRu = { US: 'США', AE: 'ОАЭ' }[c.cc];
    names.set(c.cc, { ru: shortRu ?? dn.ru.of(c.cc), en: dn.en.of(c.cc), hay: norm([dn.ru.of(c.cc), dn.en.of(c.cc), c.cc, ...c.aliases].join(' ')) });
  }
}
export const countryName = (cc) => { if (!names) build(); return names.get(cc)?.[lang] ?? cc; };
export const countryMatches = (cc, q) => { if (!names) build(); const hay = names.get(cc)?.hay ?? ''; return norm(q).split(/\s+/).every((w) => hay.includes(w)); };
export const stationMatches = (s, q) => {
  const hay = norm(`${s.name} ${s.alt ?? ''} ${genreAll(s.genre)} ${s.country === 'RU' ? '' : `${dn.ru.of(s.country)} ${dn.en.of(s.country)}`}`);
  return norm(q).split(/\s+/).every((w) => hay.includes(w));
};
