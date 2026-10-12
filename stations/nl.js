import { q, hid, hls, HR } from './lib.js';
// Нидерланды: NL. Проверено 2026-10-12, из России.
const ST = 'https://playerservices.streamtheworld.com/api/livestream-redirect';
export default [
  { id: 'nl-538', name: 'Radio 538', country: 'NL', genre: 'hits', mark: '538', hue: 12,
    alt: 'Радио 538 Нидерланды',
    qualities: [
      q(128, `${ST}/RADIO538.mp3`, 'http://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538.mp3'),
    ] },
  { id: 'nl-qmusic', name: 'Qmusic', country: 'NL', genre: 'pop', mark: 'Q', hue: 330,
    alt: 'Кью мьюзик',
    qualities: [
      hid(96, 'https://icecast-qmusicnl-cdp.triple-it.nl/Qmusic_nl_live_96.mp3'),
      q(128, 'https://stream.qmusic.nl/qmusic/mp3'),
    ] },
  { id: 'nl-radio2', name: 'NPO Radio 2', country: 'NL', genre: 'pop', mark: 'R2', hue: 28,
    alt: 'НПО радио 2',
    qualities: [
      q(192, 'https://icecast.omroep.nl/radio2-bb-mp3'),
    ] },
  { id: 'nl-3fm', name: 'NPO 3FM', country: 'NL', genre: 'alternative', mark: '3FM', hue: 350,
    alt: 'НПО 3 ФМ',
    qualities: [
      q(192, 'https://icecast.omroep.nl/3fm-bb-mp3'),
    ] },
  { id: 'nl-slam', name: 'SLAM!', country: 'NL', genre: 'dance', mark: 'SL', hue: 290,
    alt: 'Слэм',
    qualities: [
      q(128, 'http://stream.slam.nl/slam'),
    ] },
  { id: 'nl-538dance', name: 'Radio 538 Dance Department', country: 'NL', genre: 'electronic', mark: 'DD', hue: 265,
    alt: 'Радио 538 дэнс департмент',
    qualities: [
      q(128, `${ST}/TLPSTR01.mp3`),
    ] },
  { id: 'nl-arrow', name: 'Arrow Classic Rock', country: 'NL', genre: 'rock', mark: 'AR', hue: 5,
    alt: 'Эрроу классик рок',
    qualities: [
      hid(96, 'https://stream.player.arrow.nl/arrowcr'),
      q(192, 'http://stream.gal.io/arrow'),
    ] },
  { id: 'nl-veronica', name: 'Radio Veronica', country: 'NL', genre: 'rockpop', mark: 'Ve', hue: 45,
    alt: 'Радио Вероника',
    qualities: [
      q(128, `${ST}/VERONICA.mp3`),
    ] },
  { id: 'nl-radio1', name: 'NPO Radio 1', country: 'NL', genre: 'news', mark: 'R1', hue: 205,
    alt: 'НПО радио 1 новости',
    qualities: [
      q(192, 'https://icecast.omroep.nl/radio1-bb-mp3', 'http://icecast.omroep.nl/radio1-bb-mp3'),
    ] },
  { id: 'nl-bnr', name: 'BNR Nieuwsradio', country: 'NL', genre: 'business', mark: 'BN', hue: 220,
    alt: 'БНР новости бизнес',
    qualities: [
      q(128, 'https://stream.bnr.nl/bnr_mp3_128_20'),
    ] },
  { id: 'nl-radio4', name: 'NPO Radio 4', country: 'NL', genre: 'classical', mark: 'R4', hue: 255,
    alt: 'НПО радио 4 классика',
    qualities: [
      q(192, 'https://icecast.omroep.nl/radio4-bb-mp3', 'http://icecast.omroep.nl/radio4-bb-mp3'),
    ] },
];
