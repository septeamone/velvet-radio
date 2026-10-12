import { q, hid, hls, HR } from './lib.js';
// Испания: ES. Проверено 2026-10-12, из России.
const ST = 'https://playerservices.streamtheworld.com/api/livestream-redirect';
export default [
  { id: 'es-los40', name: 'LOS40', country: 'ES', genre: 'hits', mark: '40', hue: 15,
    alt: 'Лос 40 Испания',
    qualities: [
      q(128, `${ST}/Los40.mp3`),
    ] },
  { id: 'es-los40dance', name: 'LOS40 Dance', country: 'ES', genre: 'dance', mark: 'LD', hue: 290,
    alt: 'Лос 40 дэнс',
    qualities: [
      q(128, `${ST}/LOS40_DANCE.mp3`),
    ] },
  { id: 'es-los40urban', name: 'LOS40 Urban', country: 'ES', genre: 'latin', mark: 'LU', hue: 45,
    alt: 'Лос 40 урбан латино реггетон',
    qualities: [
      q(128, `${ST}/LOS40_URBAN.mp3`),
    ] },
  { id: 'es-dial', name: 'Cadena Dial', country: 'ES', genre: 'latin', mark: 'CD', hue: 340,
    alt: 'Кадена Диал',
    qualities: [
      q(128, `${ST}/CADENADIAL.mp3`),
    ] },
  { id: 'es-cadena100', name: 'Cadena 100', country: 'ES', genre: 'pop', mark: 'C1', hue: 200,
    alt: 'Кадена 100',
    qualities: [
      q(128, 'http://cadena100-streamers-mp3.flumotion.com/cope/cadena100.mp3'),
    ] },
  { id: 'es-ser', name: 'Cadena SER', country: 'ES', genre: 'news', mark: 'SE', hue: 5,
    alt: 'Кадена СЕР новости',
    qualities: [
      q(128, `${ST}/CADENASER.mp3`, 'http://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3'),
    ] },
  { id: 'es-ondacero', name: 'Onda Cero', country: 'ES', genre: 'news', mark: 'OC', hue: 215,
    alt: 'Онда Серо',
    qualities: [
      hls(128, 'https://atres-live.ondacero.es/live/ondacero/master.m3u8'),
    ] },
  { id: 'es-rne', name: 'Radio Nacional de España', country: 'ES', genre: 'news', mark: 'RN', hue: 355,
    alt: 'РНЕ Радио Насьональ Испания',
    qualities: [
      q(128, 'https://dispatcher.rndfnk.com/crtve/rne1/mad/mp3/high'),
    ] },
  { id: 'es-radio3', name: 'Radio 3 (RNE)', country: 'ES', genre: 'alternative', mark: 'R3', hue: 180,
    alt: 'Радио 3 РНЕ',
    qualities: [
      q(128, 'https://dispatcher.rndfnk.com/crtve/rner3/main/mp3/high'),
    ] },
  { id: 'es-rockfm', name: 'Rock FM', country: 'ES', genre: 'rock', mark: 'RK', hue: 10,
    alt: 'Рок ФМ Испания',
    qualities: [
      q(96, 'http://flucast-bl04.flumotion.com/cope/rockfm-low.mp3', 'https://rockfm-cope-rrcast.flumotion.com/cope/rockfm-low.mp3'),
    ] },
  { id: 'es-flaix', name: 'Flaix FM', country: 'ES', genre: 'electronic', mark: 'FF', hue: 320,
    alt: 'Флайш ФМ Каталония',
    qualities: [
      q(128, 'https://stream.flaixfm.cat/icecast'),
    ] },
];
