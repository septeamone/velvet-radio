import { ICY_SOURCES } from './icy-sources.js';

// «Что играет сейчас» — берём из тех же источников, что и официальные сайты станций.
// Каждый источник возвращает { artist, title } или null; если у станции источника нет — названия песни не будет.

const getJson = async (url) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

const mskDate = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

// Бэкенд группы Europa Plus Media: Europa Plus, Ретро FM, Радио 7, Дорожное радио
const emg = (code) => async () => {
  const url = `https://meta.hostingradio.ru/emg/${code}/history?date=${mskDate()}&from=00:00&to=23:59&format=native&types=3&order=desc`;
  const [t] = await getJson(url);
  return t && { artist: t.artist, title: t.title };
};

// Radio Record: один запрос на все каналы, нужный — id 15016
const record = async () => {
  const { result } = await getJson('https://www.radiorecord.ru/api/stations/now/');
  const t = result.find((s) => s.id === 15016)?.track;
  return t && { artist: t.artist, title: t.song, caps: true };
};

// BBC Sounds
const bbc = async () => {
  const { data } = await getJson('https://rms.api.bbc.co.uk/v2/services/bbc_1xtra/segments/latest?limit=1');
  const t = data?.[0];
  // BBC иногда ставит «играет сейчас» с задержкой — берём и только что закончившийся трек
  const fresh = t?.offset?.now_playing || t?.offset?.label === 'Less Than a Minute Ago';
  if (!t || t.segment_type !== 'music' || !fresh) return null;
  return { artist: t.titles.primary, title: t.titles.secondary };
};

// Сеть станций Gazprom-Media: у них один формат
const fmgid = (slug) => async () => {
  const t = await getJson(`https://meta.fmgid.com/stations/${slug}/current.json`);
  return t.title ? { artist: t.artist, title: t.title } : null; // джингл/реклама — пропускаем
};
const nextApi = (host, slug) => async () => {
  const { result } = await getJson(`https://${host}/api/n/current`);
  const t = result.data[slug]?.current;
  if (!t?.title || t.title === 'Реклама') return null;
  return { artist: t.artist, title: t.title };
};

// JSON с хостинга станции (metadata.json), в нём бывают рекламы и джинглы (type != 3)
const hlsMeta = (url) => async () => {
  const { current: t } = await getJson(url);
  return t?.type === 3 && t.title ? { artist: t.artist, title: t.title, caps: true } : null;
};
const gpm = (path) => hlsMeta(`https://hls-01-gpm.hostingradio.ru/${path}/metadata.json`);

// Питер FM и Радио Ваня: один бэкенд сайтов, первый элемент плейлиста — играющий трек (названия у них заглавными)
const playlistV5 = (host, id) => async () => {
  const j = await getJson(`https://${host}/api/v5/playlists/${id}/`);
  const t = !j.adnow && j.items?.[0]?.track;
  return t?.name ? { artist: t.artist?.name, title: t.name, caps: true } : null;
};

// Название песни прямо из потока (ICY): открываем поток, читаем первый блок метаданных и закрываем.
const icy = (url, clean = (x) => x) => async () => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, { headers: { 'Icy-MetaData': '1' }, signal: ctrl.signal });
    const every = +r.headers.get('icy-metaint');
    if (!every) return null;
    const reader = r.body.getReader();
    let buf = new Uint8Array(0);
    const need = () => (buf.length > every ? every + 1 + buf[every] * 16 : every + 1);
    while (buf.length < need()) {
      const { value, done } = await reader.read();
      if (done) return null;
      const next = new Uint8Array(buf.length + value.length);
      next.set(buf); next.set(value, buf.length);
      buf = next;
    }
    const block = buf.subarray(every + 1, need());
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(block); } catch { text = new TextDecoder('windows-1251').decode(block); }   // часть русских станций отдаёт кодировку Windows-1251
    const m = /StreamTitle='(.*?)';/s.exec(text);
    const title = m && clean(m[1].trim());
    if (!title) return null;
    const [artist, ...rest] = title.split(' - ');
    return rest.length ? { artist, title: rest.join(' - '), caps: true } : { artist: null, title, caps: true };
  } finally { clearTimeout(timer); ctrl.abort(); }
};

const SOURCES = {
  ultra: fmgid('ultra'),
  nashe: fmgid('nashe'),
  rusradio: nextApi('rusradio.ru', 'russkoe-radio'),
  dfm: nextApi('dfm.ru', 'dfm'),
  maximum: nextApi('maximum.ru', 'maximum'),
  hitfm: nextApi('hitfm.ru', 'hit-fm'),
  montecarlo: nextApi('montecarlo.ru', 'radio-monte-carlo'),
  comedy: gpm('comedyradio495'),
  relax: icy('https://pub0201.101.ru/stream/trust/mp3/128/24', (x) => x.replace(/ - \d+:\d{2}$/, '')),
  love: icy('https://stream2.n340.com/12_love_64_reg_44?type=aac&UID=1C254BF561F74C9BFDBAF0957371CB7B'),
  europaplus: emg('europaplus'),
  retro: emg('retrofm'),
  radio7: emg('radio7'),
  dorognoe: emg('dorognoe'),
  studio21: emg('studio21'),
  radiovera: hlsMeta('https://hls-01-radiovera.hostingradio.ru/radiovera/metadata.json'),
  radiozenit: hlsMeta('https://hls-01-radiozenit.hostingradio.ru/radiozenit/metadata.json'),
  keksfm: hlsMeta('https://hls-01-keks.emgsound.ru/7/metadata.json'),
  piterfm: playlistV5('radiopiterfm.ru', 8),
  radiovanya: playlistV5('radiovanya.ru', 0),
  eldoradio: emg('eldoradio'),
  rusongs: icy('http://listen.rusongs.ru/ru-hd'),
  megapolis: icy('http://online.radio-megapolis.ru:8000/megapolis_mp3'),
  horoshee: icy('https://hr.amgradio.ru/Horoshee'),
  record,
  bbc1xtra: bbc,
};

// Для списка «что играет везде» берём только лёгкие источники (запрос JSON); ICY открывает сам поток, это тяжело.
export const LIVE = new Set(Object.keys(SOURCES).filter((id) => !['relax', 'love', 'rusongs', 'megapolis', 'horoshee'].includes(id)));

const nice = (s) => s.toLowerCase().replace(/(^|[\s/(-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

// Служебные строки в ICY: джинглы, рекламные паузы, пустые заглушки, время трека в конце
const icyJunk = /return_to_program|station break|right back after|^\W*$/i;
const icyClean = (x) => { const s = x.replace(/ - \d+:\d{2}$/, '').trim(); return icyJunk.test(s) ? '' : s; };

export async function fetchTrack(stationId) {
  const t = await (SOURCES[stationId] ?? (ICY_SOURCES[stationId] && icy(ICY_SOURCES[stationId], icyClean)))?.();
  if (!t || !t.title) return null;
  const up = (x) => (t.caps && x && x === x.toUpperCase() ? nice(x) : x);
  const artist = up(t.artist), title = up(t.title);
  return artist ? `${artist} — ${title}` : title;
}
