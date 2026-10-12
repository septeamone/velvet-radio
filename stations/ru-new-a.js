import { q, hid, hls, HR } from './lib.js';
// Россия: поп, хиты, рок, ретро, танцы. Проверено 2026-10-12, из России. Битрейт заявленный (icy-br / HLS / адрес).
const GPM = (name) => [
  hid(96, `http://rmg.hostingradio.ru/gpm-${name}495.aacp`),
  hls(128, `https://hls-01-gpm.hostingradio.ru/${name}495/playlist.m3u8`),
];
const NASHE = (name, ...extra) => [
  q(128, `http://nashe1.hostingradio.ru/${name}-128.mp3`, `http://nashe3.hostingradio.ru/${name}-128.mp3`, `https://nashe1.hostingradio.ru/${name}-128.mp3`, ...extra),
  q(256, `http://nashe1.hostingradio.ru/${name}-256`, `http://nashe3.hostingradio.ru/${name}-256`, `https://main.hostingradio.ru/${name}-256`),
];
const HLS112 = (url) => ({ ...hls(112, url), hide: true });
const R101 = (id) => q(128, `https://pub0201.101.ru/stream/trust/mp3/128/${id}`, `https://srv01.gpmradio.ru/stream/trust/mp3/128/${id}`, `https://srv02.gpmradio.ru:8443/stream/trust/mp3/128/${id}`, `https://pub0101.101.ru/stream/trust/mp3/128/${id}`);
export default [
  { id: 'avtoradio', name: 'Авторадио', country: 'RU', genre: 'hits', mark: 'А', hue: 215, alt: 'Avtoradio Авто радио', qualities: GPM('avtoradio') },
  { id: 'energy', name: 'Радио ENERGY (NRJ)', country: 'RU', genre: 'dance', mark: 'E', hue: 0, alt: 'Энерджи Эни Эр Джей NRJ Energy', qualities: GPM('energyfm') },
  { id: 'likefm', name: 'Like FM', country: 'RU', genre: 'pop', mark: 'L', hue: 320, alt: 'Лайк ФМ', qualities: GPM('likefm') },
  { id: 'humor', name: 'Юмор FM', country: 'RU', genre: 'humor', mark: 'Ю', hue: 55, alt: 'Humor FM Юмор ФМ', qualities: GPM('humorfm') },
  { id: 'romantika', name: 'Радио Romantika', country: 'RU', genre: 'love', mark: 'Ro', hue: 350, alt: 'Радио Романтика', qualities: GPM('romantika') },
  { id: 'novoe', name: 'Новое Радио', country: 'RU', genre: 'pop', mark: 'Н', hue: 160, alt: 'Novoe Radio Новое радио', qualities: [
    hid(96, 'https://stream.newradio.ru/novoe96.aacp', 'http://stream.newradio.ru/moscow.novoe.aacp'),
    HLS112('https://hls.newradio.ru/novoeradio-msk/playlist.m3u8'),
    q(256, 'https://emgregion.hostingradio.ru:8064/moscow.novoe.mp3', 'http://emgregion.hostingradio.ru:8064/moscow.novoe.mp3')] },
  { id: 'dacha', name: 'Радио Дача', country: 'RU', genre: 'rushits', mark: 'Д', hue: 200, alt: 'Dacha', qualities: [
    q(128, 'http://microit.n340.com:9000/VgMv0WV17ZVx1uuo_12_dacha_128_reg_1093', 'https://stream2.n340.com/12_dacha_128_reg_1093?type=aac&UID=1C254BF561F74C9BFDBAF0957371CB7B', 'http://stream2.n340.com/12_dacha_128_reg_1093?type=aac&UID=1C254BF561F74C9BFDBAF0957371CB7B')] },
  { id: 'rockfm', name: 'Rock FM', country: 'RU', genre: 'rock', mark: 'R', hue: 10, alt: 'Рок ФМ', qualities: NASHE('rock') },
  { id: 'bestfm', name: 'Radio BEST', country: 'RU', genre: 'rockpop', mark: 'B', hue: 40, alt: 'Бест ФМ Best FM Радио Бест', qualities: NASHE('best', 'http://nashe.streamr.ru/best-128.mp3') },
  { id: 'chocolate', name: 'Радио Шоколад', country: 'RU', genre: 'pop', mark: 'Ш', hue: 25, alt: 'Chocolate Radio', qualities: [
    HLS112('https://hls-01-choco.hostingradio.ru/choco/playlist.m3u8'),
    q(256, ...HR('choco.hostingradio.ru:10010', 'fm'))] },
  { id: 'mv', name: 'Милицейская волна', country: 'RU', genre: 'rushits', mark: 'МВ', hue: 205, alt: 'Radio MV Милицейская волна', qualities: [
    HLS112('https://hls-01-radiomv.hostingradio.ru/radiomv/playlist.m3u8'),
    q(128, 'http://radiomv.hostingradio.ru/radiomv128.mp3', 'https://radiomv.hostingradio.ru:80/radiomv128.mp3'),
    q(256, 'http://radiomv.hostingradio.ru/radiomv256.mp3', 'https://radiomv.hostingradio.ru:80/radiomv256.mp3')] },
  { id: 'strana', name: 'Страна FM', country: 'RU', genre: 'rushits', mark: 'С', hue: 345, alt: 'Strana FM Страна ФМ', qualities: [
    q(320, 'https://icecast-stranafm.cdnvideo.ru/stranafm', 'http://icecast.stranafm.cdnvideo.ru/stranafm')] },
  { id: 'silver', name: 'Серебряный дождь', country: 'RU', genre: 'pop', mark: 'СД', hue: 230, alt: 'Silver Rain', qualities: [
    q(128, 'https://silverrain.hostingradio.ru/silver128.mp3', 'http://silverrain.hostingradio.ru/silver128.mp3', 'http://213.59.4.27:8000/silver128.mp3')] },
  { id: 'radiord', name: 'Радио Родных Дорог', country: 'RU', genre: 'rushits', mark: 'РД', hue: 20, alt: 'Radio RD', qualities: [
    hid(96, 'http://stream1.radiord.ru:8000/live96.aac'),
    q(128, ...HR('stream1.radiord.ru:8000', 'live128.mp3'))] },
  { id: 'club101', name: '101.ru: Club Dance', country: 'RU', genre: 'dance', mark: '101', hue: 30, alt: 'Клаб Дэнс 101 ру', qualities: [R101(5)] },
  { id: 'russiandance101', name: '101.ru: Russian Dance', country: 'RU', genre: 'dance', mark: '101', hue: 15, alt: 'Русский данс 101 ру', qualities: [R101(17)] },
];
