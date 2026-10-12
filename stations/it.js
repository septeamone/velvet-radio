import { q, hid, hls, HR } from './lib.js';
// Италия: IT. Проверено 2026-10-12, из России.
// Radio Deejay / m2o / Radio Capital: HLS ~122 kbps (AAC+), подписываем 128.
const GEDI = 'https://4c4b867c89244861ac216426883d1ad0.msvdn.net';
export default [
  { id: 'it-rtl1025', name: 'RTL 102.5', country: 'IT', genre: 'pop', mark: 'RT', hue: 215,
    alt: 'РТЛ 102.5 Италия',
    qualities: [
      hls(192, 'https://dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S97044836/tbbP8T1ZRPBL/playlist_audio.m3u8'),
      q(320, 'https://streamingv2.shoutcast.com/rtl-1025', 'http://streamingv2.shoutcast.com/rtl-1025'),
    ] },
  { id: 'it-radio105', name: 'Radio 105', country: 'IT', genre: 'hits', mark: '105', hue: 8,
    alt: 'Радио 105 Италия',
    qualities: [
      q(128, 'https://icecast.unitedradio.it/Radio105.mp3', 'http://icecast.unitedradio.it/Radio105.mp3'),
    ] },
  { id: 'it-deejay', name: 'Radio Deejay', country: 'IT', genre: 'dance', mark: 'DJ', hue: 48,
    alt: 'Радио Диджей Италия',
    qualities: [
      hls(128, `${GEDI}/radiodeejay/radiodeejay/master_ma.m3u8`),
    ] },
  { id: 'it-m2o', name: 'Radio m2o', country: 'IT', genre: 'electronic', mark: 'm2', hue: 285,
    alt: 'Радио м2о Италия электроника',
    qualities: [
      hls(128, `${GEDI}/radiom2o/radiom2o/master_ma.m3u8`),
    ] },
  { id: 'it-virgin', name: 'Virgin Radio', country: 'IT', genre: 'rock', mark: 'VR', hue: 350,
    alt: 'Вирджин радио Италия',
    qualities: [
      q(128, 'https://icecast.unitedradio.it/Virgin.mp3', 'http://icecast.unitedradio.it/Virgin.mp3'),
    ] },
  { id: 'it-virginclassic', name: 'Virgin Radio Classic Rock', country: 'IT', genre: 'rock', mark: 'CR', hue: 20,
    alt: 'Вирджин радио классик рок',
    qualities: [
      q(128, 'https://icecast.unitedradio.it/VirginRockClassics.mp3', 'http://icy.unitedradio.it/VirginRockClassics.mp3'),
    ] },
  { id: 'it-freccia', name: 'Radio Freccia', country: 'IT', genre: 'rock', mark: 'RF', hue: 0,
    alt: 'Радио Фреччиа',
    qualities: [
      hls(192, 'https://dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S3160845/0tuSetc8UFkF/playlist_audio.m3u8'),
    ] },
  { id: 'it-rai1', name: 'Rai Radio 1', country: 'IT', genre: 'news', mark: 'R1', hue: 205,
    alt: 'Рай радио 1 новости',
    qualities: [
      q(256, 'https://icestreaming.rai.it/1.mp3', 'http://icestreaming.rai.it/1.mp3'),
    ] },
  { id: 'it-rai2', name: 'Rai Radio 2', country: 'IT', genre: 'pop', mark: 'R2', hue: 30,
    alt: 'Рай радио 2',
    qualities: [
      q(256, 'https://icestreaming.rai.it/2.mp3', 'http://icestreaming.rai.it/2.mp3'),
    ] },
  { id: 'it-rai3', name: 'Rai Radio 3', country: 'IT', genre: 'classical', mark: 'R3', hue: 260,
    alt: 'Рай радио 3 культура',
    qualities: [
      q(320, 'https://icestreaming.rai.it/3.mp3', 'http://icestreaming.rai.it/3.mp3'),
    ] },
  { id: 'it-raiclassica', name: 'Rai Radio Classica', country: 'IT', genre: 'classical', mark: 'RC', hue: 340,
    alt: 'Рай радио классика',
    qualities: [
      q(256, 'https://icestreaming.rai.it/5.mp3', 'http://icestreaming.rai.it/5.mp3'),
      hls(320, 'https://radiotreclassica-live.akamaized.net/hls/live/2032595/radiotreclassica/radiotreclassica/playlist.m3u8'),
    ] },
];
