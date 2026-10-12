import { q, hid, hls } from './lib.js';
const BBC = 'https://as-hls-ww-live.akamaized.net/pool_92079267/live/ww/bbc_1xtra/bbc_1xtra.isml/bbc_1xtra-audio%3d';
// Великобритания: станции из каталога 1.0.0 (id не менять).
export default [
  { id: 'bbc1xtra', name: 'BBC Radio 1Xtra', genre: 'electronic', country: 'GB', mark: '1X', hue: 280, qualities: [
    hls(128, `${BBC}128000.norewind.m3u8`), hls(320, `${BBC}320000.norewind.m3u8`)] },
];
