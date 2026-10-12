import { q, hid, hls } from './lib.js';
// ОАЭ: AE. Проверено 2026-10-12, из России.
// Эфиры Abu Dhabi Media берём из HLS-мастера только как аудио-вариант (~120 kbps AAC): в мастере есть и видео, нужен именно аудио-плейлист.
// Радиосети Dubai Media / ARN (Dubai Eye, Hit 96.7, Dubai FM, Virgin Dubai) закрыты токеном/регионом — отсюда не играют.
const H = (url) => ({ url, hls: true });
const ADMN = (dir, audio) => `https://admn-radio-cdn-lb.starzplayarabia.com/out/v1/admn_radio_enc/${dir}/${dir}_hls_nd/index_${audio}_audio_enc_ara.m3u8`;
export default [
  { id: 'ae-emaratfm', name: 'Emarat FM (إمارات إف إم)', country: 'AE', genre: 'arabic', mark: 'EF', hue: 5,
    alt: 'Эмират ФМ Эмираты арабская музыка Абу-Даби Emarat FM',
    qualities: [q(128, H(ADMN('emarat_fm', 'emaratfm')))] },
  { id: 'ae-abudhabifm', name: 'Abu Dhabi FM (أبوظبي إف إم)', country: 'AE', genre: 'arabic', mark: 'AD', hue: 30,
    alt: 'Абу-Даби ФМ арабская музыка Эмираты Abu Dhabi Radio',
    qualities: [q(128, H(ADMN('abudhabi_fm', 'adfm')))] },
  { id: 'ae-starfm', name: 'Star FM Abu Dhabi (ستار إف إم)', country: 'AE', genre: 'hits', mark: 'SF', hue: 48,
    alt: 'Стар ФМ Абу-Даби англоязычные хиты Star FM Emirates',
    qualities: [q(128, H(ADMN('star_fm', 'starfm')))] },
  { id: 'ae-classicfm', name: 'Classic FM Abu Dhabi (كلاسيك إف إم)', country: 'AE', genre: 'classical', mark: 'CF', hue: 260,
    alt: 'Классик ФМ Абу-Даби классическая музыка Abu Dhabi Classic FM',
    qualities: [q(128, H(ADMN('classic_fm', 'classicfm')))] },
  { id: 'ae-skynewsarabia', name: 'Sky News Arabia (سكاي نيوز عربية)', country: 'AE', genre: 'news', mark: 'SN', hue: 205,
    alt: 'Скай Ньюс Арабия новости на арабском Абу-Даби Sky News Arabia Radio',
    qualities: [q(192, H('https://stream.skynewsarabia.com/hls/index__1.m3u8'), H('http://stream.skynewsarabia.com/hls/index__1.m3u8'))] },
  { id: 'ae-alarabiyafm', name: 'Al Arabiya FM (العربية إف إم)', country: 'AE', genre: 'arabic', mark: 'AA', hue: 195,
    alt: 'Аль-Арабия ФМ Дубай арабское радио Al Arabiya FM',
    qualities: [q(128, H('https://fm.alarabiya.net/fm/myStream/playlist.m3u8'))] },
  { id: 'ae-bigfm', name: 'BIG FM 106.2 Dubai', country: 'AE', genre: 'hits', mark: 'BG', hue: 350,
    alt: 'Биг ФМ Дубай хинди болливуд хиты BIG FM UAE Fun Asia',
    qualities: [q(128, 'https://funasia.streamguys1.com/live4')] },
  { id: 'ae-luv1071', name: 'Luv 107.1 Dubai', country: 'AE', genre: 'hits', mark: 'LV', hue: 325,
    alt: 'Лав 107.1 Дубай хиты Luv FM UAE Fun Asia',
    qualities: [q(256, 'https://funasia.streamguys1.com/live2')] },
  { id: 'ae-djradio', name: 'DJ Radio Dubai', country: 'AE', genre: 'dance', mark: 'DJ', hue: 285,
    alt: 'Ди-джей радио Дубай клубная музыка DJ Radio Dubai',
    qualities: [q(192, 'https://listen.radioking.com/radio/623812/stream/685903')] },
];
