import { q, hid, hls, HR } from './lib.js';
// Австралия: AU. Проверено 2026-10-12, из России. ABC — HLS-мастер (варианты 252 и 140 kbps, плеер сам выбирает).
const T = (name) => HR('playerservices.streamtheworld.com', `api/livestream-redirect/${name}`);
const ABC = (name, id) => [`https://streaming.abc-cdn.net.au/audio/hls/${name}.m3u8?source=web`, `https://mediaserviceslive.akamaized.net/hls/live/${id}/${name}/index.m3u8`].map((url) => ({ url, hls: true }));
export default [
  { id: 'au-triplej', name: 'triple j', country: 'AU', genre: 'alternative', mark: 'J', hue: 8, alt: 'Трипл Джей ABC молодёжная альтернатива',
    qualities: [q(256, ...ABC('triplejnsw', 2038308))] },
  { id: 'au-doublej', name: 'Double J', country: 'AU', genre: 'rock', mark: 'DJ', hue: 330, alt: 'Даббл Джей ABC рок',
    qualities: [q(256, { url: 'https://streaming.abc-cdn.net.au/audio/hls/doublejnsw.m3u8?source=web', hls: true })] },
  { id: 'au-kiis1065', name: 'KIIS 106.5', country: 'AU', genre: 'pop', mark: 'K', hue: 310, alt: 'Кис 106.5 Сидней поп хиты',
    qualities: [q(128, ...T('ARN_KIIS1065.mp3'))] },
  { id: 'au-nova969', name: 'Nova 96.9', country: 'AU', genre: 'hits', mark: 'N', hue: 25, alt: 'Нова 96.9 Сидней хиты',
    qualities: [hid(96, ...T('NOVA_969.mp3')), q(320, ...T('NOVA_969_AAC320.aac'))] },
  { id: 'au-nova100', name: 'Nova 100', country: 'AU', genre: 'hits', mark: 'N1', hue: 50, alt: 'Нова 100 Мельбурн хиты',
    qualities: [q(320, ...T('NOVA_100_AAC320.aac'))] },
  { id: 'au-smooth953', name: 'Smooth FM 95.3', country: 'AU', genre: 'lounge', mark: 'Sm', hue: 190, alt: 'Смуз ФМ Сидней',
    qualities: [q(320, ...T('SMOOTH953_AAC320.aac'))] },
  { id: 'au-triplem', name: 'Triple M Sydney', country: 'AU', genre: 'rock', mark: 'M', hue: 15, alt: 'Трипл Эм Сидней рок',
    qualities: [q(128, 'http://legacy.scahw.com.au/2mmm_128', 'https://legacy.scahw.com.au/2mmm_128', { url: 'https://sa47.scastream.com.au/live/2mmm_128.stream/playlist.m3u8', hls: true })] },
  { id: 'au-triplemclassicrock', name: 'Triple M Classic Rock', country: 'AU', genre: 'rock', mark: 'CR', hue: 355, alt: 'Трипл Эм Классик Рок',
    qualities: [hls(128, 'https://sa47.scastream.com.au/live/2classicrock_128.stream/playlist.m3u8')] },
  { id: 'au-newsradio', name: 'ABC NewsRadio', country: 'AU', genre: 'news', mark: 'AB', hue: 215, alt: 'АБС Ньюс Радио новости Австралия',
    qualities: [q(112, ...ABC('newsradio', 2038311))] },
  { id: 'au-skynews', name: 'Sky News Australia Radio', country: 'AU', genre: 'news', mark: 'SN', hue: 200, alt: 'Скай Ньюс Австралия радио новости',
    qualities: [q(128, ...T('NOVA_SKYNEWS.mp3'))] },
  { id: 'au-fresh927', name: 'Fresh 92.7', country: 'AU', genre: 'electronic', mark: 'Fr', hue: 160, alt: 'Фреш 92.7 Аделаида танцевальная электроника',
    qualities: [q(192, 'https://live.fresh927.com.au/freshmp3')] },
];
