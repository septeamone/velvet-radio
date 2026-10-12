import { q, hid, hls, HR } from './lib.js';
// Аргентина: AR. Проверено 2026-10-12, из России. Крупные аргентинские FM/AM отдают максимум 96 kbps — выше потоков нет.
const T = (name) => HR('playerservices.streamtheworld.com', `api/livestream-redirect/${name}`);
const TANGO = { ru: 'Танго', en: 'Tango' };
const CUMBIA = { ru: 'Кумбия', en: 'Cumbia' };
export default [
  { id: 'ar-la100', name: 'La 100', country: 'AR', genre: 'pop', mark: 'L1', hue: 8, alt: 'Ла Сьен 99.9 Буэнос-Айрес поп',
    qualities: [q(96, ...T('FM999_56.mp3'))] },
  { id: 'ar-disney', name: 'Radio Disney 94.3', country: 'AR', genre: 'pop', mark: 'D', hue: 220, alt: 'Радио Дисней Аргентина',
    qualities: [q(128, ...T('DISNEY_ARG_BA_ADP.aac'), ...T('DISNEY_ARG_BA.mp3'))] },
  { id: 'ar-popradio', name: 'Pop Radio 101.5', country: 'AR', genre: 'pop', mark: 'Po', hue: 320, alt: 'Поп радио Буэнос-Айрес',
    qualities: [hls(96, 'https://popradio.stweb.tv/popradio/live/playlist.m3u8')] },
  { id: 'ar-rockandpop', name: 'Rock & Pop 95.9', country: 'AR', genre: 'rock', mark: 'RP', hue: 0, alt: 'Рок энд поп Буэнос-Айрес рок на испанском',
    qualities: [q(96, ...T('ROCKANDPOP.mp3'))] },
  { id: 'ar-metro', name: 'Metro 95.1', country: 'AR', genre: 'rock', mark: 'Me', hue: 250, alt: 'Метро 95.1 Буэнос-Айрес рок',
    qualities: [q(96, ...T('METRO.mp3'))] },
  { id: 'ar-mega', name: 'Mega 98.3', country: 'AR', genre: 'rock', mark: 'Mg', hue: 30, alt: 'Мега 98.3 рок насьональ аргентинский рок',
    qualities: [hls(96, 'https://mega.stweb.tv/mega983/live/playlist.m3u8')] },
  { id: 'ar-mucha', name: 'Mucha Radio 94.7', country: 'AR', genre: CUMBIA, mark: 'Mu', hue: 130, alt: 'Муча радио кумбия',
    qualities: [q(96, ...T('MUCHA_RADIO.mp3'))] },
  { id: 'ar-la2x4', name: 'La 2x4', country: 'AR', genre: TANGO, mark: '24', hue: 45, alt: 'Ла дос по куатро танго Буэнос-Айрес',
    qualities: [q(128, 'https://media.radios.ar:9270/')] },
  { id: 'ar-mitre', name: 'Radio Mitre AM 790', country: 'AR', genre: 'news', mark: 'Mi', hue: 205, alt: 'Радио Митре новости Буэнос-Айрес',
    qualities: [q(96, ...T('AM790_56.mp3'))] },
  { id: 'ar-rivadavia', name: 'Radio Rivadavia AM 630', country: 'AR', genre: 'news', mark: 'Ri', hue: 170, alt: 'Радио Ривадавия новости',
    qualities: [q(96, ...T('RIVADAVIA.mp3'))] },
  { id: 'ar-lared', name: 'Radio La Red AM 910', country: 'AR', genre: 'news', mark: 'LR', hue: 350, alt: 'Радио Ла Ред новости спорт',
    qualities: [q(96, ...T('LA_RED_AM910.mp3'))] },
];
