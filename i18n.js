// Два языка интерфейса (русский / английский). Язык по умолчанию — по языку браузера, переключатель в шапке окна.
import { GENRES, COUNTRIES } from './stations.js';

const STR = {
  ru: {
    secMain: 'Основное', secSound: 'Звук', secLook: 'Внешний вид', secData: 'Данные', secMore: 'Ещё', navMain: 'Основное', navSound: 'Звук',
    navLook: 'Вид', navData: 'Данные', navMore: 'Ещё', sBufFast: 'Быстро', sBufBal: 'Баланс', sBufSafe: 'Надёжно',
    sBufFastT: 'Запас 4 секунды: быстрый старт', sBufBalT: 'Запас 9 секунд: по умолчанию', sBufSafeT: 'Запас 14 секунд: меньше всего заиканий',
    sReset: 'Сбросить настройки', sResetD: 'Избранное и порядок не изменятся', sResetBtn: 'Сбросить', sResetSure: 'Точно?', kPause: 'Пауза',
    kNext: 'Следующая', kPrev: 'Предыдущая', kNone: 'не задана',
    search: 'Поиск станции', searchCountries: 'Поиск страны или станции',
    tabFav: 'Избранное', tabCountries: 'Страны',
    pick: 'Выберите станцию', pickHint: 'Нажмите на любую из списка',
    retry: 'Повторить', playPause: 'Играть / пауза', volume: 'Громкость', theme: 'Сменить тему',
    telegram: 'Telegram автора · откроется в браузере', language: 'Язык: русский · нажмите, чтобы переключить на English', jump: 'К играющей', jumpTip: 'Показать играющую станцию в списке', mute: 'Выключить звук', unmute: 'Включить звук', qualityTip: 'Качество звука', favAdd: 'В избранное', quality: 'Качество',
    emptyFav: 'Пока пусто — нажмите на сердечко у станции', nothing: 'Ничего не найдено',
    unavailable: 'Станция недоступна', connecting: 'Подключение…', playingAt: 'Играет · {k} kbps',
    googleIt: 'Найти эту песню в Google', back: 'Назад', viewList: 'Список', viewTiles: 'Плитки', countriesLabel: 'Страны',
    stationsFound: 'Станции',
    n_mirror: 'Пробую резервный поток…', n_reconnect: 'Переподключение…', n_lower: 'Снижаю качество до {k} kbps…', n_backup: 'Резервное качество · {k} kbps',
    settings: 'Настройки', genre: 'Жанр', genreAll: 'Все жанры', report: 'Сообщить о проблеме',
    sSaver: 'Экономия трафика', sSaverD: 'Играть с самым низким качеством',
    sViz: 'Визуализатор', sVizD: 'Волна под плеером. Без неё плеер ниже',
    sClassic: 'Классический вид', sClassicD: 'Стеклянные панели. Окно перезагрузится',
    sTour: 'Обучение', sTourD: 'Короткий тур по окну', sTourBtn: 'Показать',
    tourAria: 'Обучение', tourPick: 'Ваша страна', tourSuggest: 'Рекомендуем по языку браузера', tourBack: 'Назад', tourSkip: 'Пропустить', tourNext: 'Далее', tourDone: 'Готово', tourOf: '{n} из {total}',
    tour_welcome_t: 'Добро пожаловать', tour_welcome_d: 'Выберите свою страну: её станции будут на первой вкладке. Позже это можно изменить в настройках.',
    tour_tabs_t: 'Три вкладки', tour_tabs_d: 'Первая — ваша страна, затем избранное и все страны мира с флагами.',
    tour_search_t: 'Поиск и жанры', tour_search_d: 'Ищите по названию станции или страны, кнопка справа оставляет нужный жанр. С клавиатуры поиск открывает клавиша «/».',
    tour_row_t: 'Нажмите на станцию', tour_row_d: 'Она сразу заиграет. Строки можно перетаскивать, чтобы любимые стояли выше.',
    tour_quality_t: 'Качество звука', tour_quality_d: 'У играющей станции в плеере есть кнопка с битрейтом: нажмите её и выберите качество. По умолчанию играет лучшее; если поток упадёт, радио само перейдёт на запасной.',
    tour_heart_t: 'Избранное', tour_heart_d: 'Сердечко добавляет станцию на вкладку «Избранное», чтобы она всегда была под рукой.',
    tour_player_t: 'Плеер', tour_player_d: 'Пауза, громкость и название песни. Горячие клавиши: Alt+Shift+P пауза, Alt+Shift+←/→ соседние станции; работают и медиаклавиши.',
    tour_settings_t: 'Настройки', tour_settings_d: 'Здесь ваша страна, экономия трафика, резервная копия и синхронизация. Обучение можно пройти ещё раз.',
    wnDone: 'Понятно',
    wn_intro_t: 'Velvet Radio обновился', wn_intro_d: 'Версия 1.7: новые станции, удобнее плеер и настройки. Покажем главное за полминуты.',
    wn_stations_t: '20 новых станций', wn_stations_d: 'Studio 21, Питер FM, Эльдорадио, Радио Ваня, Soundpark Deep и другие. Названия песен теперь у ещё 65 станций.',
    wn_country_t: 'Своя страна', wn_country_d: 'Сделайте любую страну первой вкладкой: Настройки → «Моя страна» или кнопка «Сделать главной» в карточке страны.',
    wn_player_t: 'Качество в плеере', wn_player_d: 'Битрейт теперь выбирается кнопкой в плеере, а не в каждой строке. Клик по логотипу или названию возвращает к играющей станции.',
    wn_sound_t: 'Звук', wn_sound_d: 'Клик по значку динамика (или клавиша M) выключает звук. На 0% теперь настоящая тишина.',
    wn_settings_t: 'Настройки по разделам', wn_settings_d: 'Понятные названия, быстрый переход между разделами, горячие клавиши на виду и сброс к умолчаниям.',
    sHome: 'Моя страна', sHomeD: 'Её станции — на первой вкладке', makeHome: 'Сделать главной', isHome: 'Главная',
    sFade: 'Плавные переходы', sFadeD: 'Станции сменяют друг друга без паузы',
    sResume: 'Запускать с Chrome', sResumeD: 'Продолжит последнюю станцию',
    sSync: 'Синхронизация', sSyncD: 'Избранное и порядок между компьютерами через аккаунт Chrome',
    sBuffer: 'Надёжность потока', sBufferD: 'Больше запаса — реже заикается',
    sBackup: 'Резервная копия', sBackupD: 'Избранное, порядок и настройки в файл', sExport: 'Экспорт', sImport: 'Импорт',
    sImported: 'Копия загружена', sBadFile: 'Это не копия Velvet Radio',
    sCheck: 'Проверка станций', sCheckBtn: 'Проверить', sChecking: 'Проверяю… {a}/{b}', sNeverChecked: 'Избранное проверяется раз в сутки',
    sChecked: 'Проверено {n}, не отвечают: {p}', sAllOk: 'Проверено {n}, всё работает',
    sKeys: 'Горячие клавиши', sKeysD: 'Управление без мыши', sKeysBtn: 'Изменить', sPrivacy: 'Конфиденциальность',
    badStation: 'Станция не отвечала при последней проверке',
    dotOk: 'Играет', dotWarn: 'Подключение или резервный поток', dotBad: 'Станция недоступна',
    one: 'станция', few: 'станции', many: 'станций', other: 'станций',
  },
  en: {
    secMain: 'General', secSound: 'Sound', secLook: 'Appearance', secData: 'Data', secMore: 'More', navMain: 'General', navSound: 'Sound',
    navLook: 'Look', navData: 'Data', navMore: 'More', sBufFast: 'Fast', sBufBal: 'Balanced', sBufSafe: 'Safe',
    sBufFastT: '4 second buffer: quick start', sBufBalT: '9 second buffer: default', sBufSafeT: '14 second buffer: fewest stutters',
    sReset: 'Reset settings', sResetD: 'Favorites and order stay as they are', sResetBtn: 'Reset', sResetSure: 'Sure?', kPause: 'Pause', kNext: 'Next',
    kPrev: 'Previous', kNone: 'not set',
    search: 'Search stations', searchCountries: 'Search country or station',
    tabFav: 'Favorites', tabCountries: 'Countries',
    pick: 'Pick a station', pickHint: 'Tap any station in the list',
    retry: 'Retry', playPause: 'Play / pause', volume: 'Volume', theme: 'Toggle theme',
    telegram: "Author's Telegram · opens in browser", language: 'Language: English · click to switch to Русский', jump: 'Now playing', jumpTip: 'Show the playing station in the list', mute: 'Mute', unmute: 'Unmute', qualityTip: 'Sound quality', favAdd: 'Add to favorites', quality: 'Quality',
    emptyFav: 'Nothing here yet — tap the heart on a station', nothing: 'Nothing found',
    unavailable: 'Station unavailable', connecting: 'Connecting…', playingAt: 'Playing · {k} kbps',
    googleIt: 'Search this song on Google', back: 'Back', viewList: 'List', viewTiles: 'Tiles', countriesLabel: 'Countries',
    stationsFound: 'Stations',
    n_mirror: 'Trying a backup stream…', n_reconnect: 'Reconnecting…', n_lower: 'Lowering quality to {k} kbps…', n_backup: 'Backup quality · {k} kbps',
    settings: 'Settings', genre: 'Genre', genreAll: 'All genres', report: 'Report a problem',
    sSaver: 'Data saver', sSaverD: 'Play the lowest quality',
    sViz: 'Visualizer', sVizD: 'The wave under the player. Off: a shorter player',
    sClassic: 'Classic look', sClassicD: 'Glass panels. The window will reload',
    sTour: 'Tour', sTourD: 'A short guided tour of the window', sTourBtn: 'Show',
    tourAria: 'Tour', tourPick: 'Your country', tourSuggest: 'Suggested from your browser language', tourBack: 'Back', tourSkip: 'Skip', tourNext: 'Next', tourDone: 'Done', tourOf: '{n} of {total}',
    tour_welcome_t: 'Welcome', tour_welcome_d: 'Pick your country: its stations will be on the first tab. You can change it later in settings.',
    tour_tabs_t: 'Three tabs', tour_tabs_d: 'First is your country, then favorites and every country in the world with flags.',
    tour_search_t: 'Search and genres', tour_search_d: 'Search by station or country name; the button on the right keeps one genre. Press "/" to search from the keyboard.',
    tour_row_t: 'Click a station', tour_row_d: 'It starts right away. Drag rows to keep your favorites on top.',
    tour_quality_t: 'Sound quality', tour_quality_d: 'The player has a bitrate button for the playing station: press it and pick the quality. The best plays by default; if a stream drops, the radio falls back by itself.',
    tour_heart_t: 'Favorites', tour_heart_d: 'The heart adds a station to the Favorites tab so it is always at hand.',
    tour_player_t: 'Player', tour_player_d: 'Pause, volume and the song title. Hotkeys: Alt+Shift+P pause, Alt+Shift+←/→ neighbouring stations; media keys work too.',
    tour_settings_t: 'Settings', tour_settings_d: 'Your country, data saver, backup and sync live here. You can replay this tour any time.',
    wnDone: 'Got it',
    wn_intro_t: 'Velvet Radio was updated', wn_intro_d: 'Version 1.7: new stations, a handier player and settings. A quick half-minute look.',
    wn_stations_t: '20 new stations', wn_stations_d: 'Studio 21, Piter FM, Eldoradio, Radio Vanya, Soundpark Deep and more. Song titles now show for 65 more stations.',
    wn_country_t: 'Your own country', wn_country_d: 'Make any country the first tab: Settings → "My country", or the "Make it first" button on a country card.',
    wn_player_t: 'Quality in the player', wn_player_d: 'Pick the bitrate with a button in the player instead of in every row. Click the logo or title to jump back to the playing station.',
    wn_sound_t: 'Sound', wn_sound_d: 'Click the speaker icon (or press M) to mute. 0% is now true silence.',
    wn_settings_t: 'Settings by section', wn_settings_d: 'Plain-language labels, quick jumps between sections, shortcuts on view and a reset to defaults.',
    sHome: 'My country', sHomeD: 'Its stations open on the first tab', makeHome: 'Make it first', isHome: 'First tab',
    sFade: 'Smooth transitions', sFadeD: 'Stations change without a gap',
    sResume: 'Start with Chrome', sResumeD: 'Continues the last station',
    sSync: 'Sync', sSyncD: 'Favorites and order across computers via your Chrome account',
    sBuffer: 'Stream reliability', sBufferD: 'More buffer, fewer stutters',
    sBackup: 'Backup', sBackupD: 'Favorites, order and settings to a file', sExport: 'Export', sImport: 'Import',
    sImported: 'Backup loaded', sBadFile: 'This is not a Velvet Radio backup',
    sCheck: 'Station check', sCheckBtn: 'Check', sChecking: 'Checking… {a}/{b}', sNeverChecked: 'Favorites are checked once a day',
    sChecked: 'Checked {n}, not responding: {p}', sAllOk: 'Checked {n}, all good',
    sKeys: 'Keyboard shortcuts', sKeysD: 'Control without the mouse', sKeysBtn: 'Change', sPrivacy: 'Privacy',
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
  names.set('RU', { ru: 'Россия', en: 'Russia', hay: norm(`${dn.ru.of('RU')} ${dn.en.of('RU')} ru russia россия рф`) });
  for (const c of COUNTRIES) {
    const shortRu = { US: 'США', AE: 'ОАЭ' }[c.cc];
    names.set(c.cc, { ru: shortRu ?? dn.ru.of(c.cc), en: dn.en.of(c.cc), hay: norm([dn.ru.of(c.cc), dn.en.of(c.cc), c.cc, ...c.aliases].join(' ')) });
  }
}
export const countryName = (cc) => { if (!names) build(); return names.get(cc)?.[lang] ?? cc; };
export const countryMatches = (cc, q) => { if (!names) build(); const hay = names.get(cc)?.hay ?? ''; return norm(q).split(/\s+/).every((w) => hay.includes(w)); };
let homeCc = 'RU';                                  // станции главной страны находят по названию, а не по стране
export const setHomeCc = (cc) => { homeCc = cc; };
export const stationMatches = (s, q) => {
  const hay = norm(`${s.name} ${s.alt ?? ''} ${genreAll(s.genre)} ${s.country === homeCc ? '' : `${dn.ru.of(s.country)} ${dn.en.of(s.country)}`}`);
  return norm(q).split(/\s+/).every((w) => hay.includes(w));
};
