import { q, hid, hls, HR } from './lib.js';
// Германия: DE. Проверено 2026-10-12, из России.
export default [
  { id: 'de-antenne', name: 'ANTENNE BAYERN', country: 'DE', genre: 'pop', mark: 'AB', hue: 205,
    alt: 'Антенне Байерн Бавария',
    qualities: [
      q(128, 'https://stream.antenne.de/antenne', 'http://mp3channels.webradio.antenne.de/antenne', 'https://stream.antenne.de/antenne/stream/mp3'),
    ] },
  { id: 'de-swr3', name: 'SWR3', country: 'DE', genre: 'pop', mark: 'S3', hue: 350,
    alt: 'СВР 3 Германия',
    qualities: [
      hid(96, 'https://liveradio.swr.de/sw331ch/swr3/play.aac'),
      q(128, 'https://liveradio.swr.de/sw282p3/swr3/play.mp3', 'https://liveradio.swr.de/sw282p3/swr3/'),
    ] },
  { id: 'de-1live', name: '1LIVE', country: 'DE', genre: 'alternative', mark: '1L', hue: 320,
    alt: 'Айн Лайф WDR',
    qualities: [
      q(128, 'https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3', 'http://wdr-1live-live.icecast.wdr.de/wdr/1live/live/mp3/128/stream.mp3'),
    ] },
  { id: 'de-rockantenne', name: 'ROCK ANTENNE', country: 'DE', genre: 'rock', mark: 'RA', hue: 8,
    alt: 'Рок Антенне',
    qualities: [
      q(128, 'https://stream.rockantenne.de/rockantenne/stream/mp3', 'http://mp3channels.webradio.rockantenne.de/rockantenne'),
    ] },
  { id: 'de-paloma', name: 'Radio Paloma', country: 'DE', genre: 'schlager', mark: 'Pa', hue: 45,
    alt: 'Радио Палома шлягер',
    qualities: [
      q(128, 'http://icepool.silvacast.com/RADIOPALOMA.mp3', 'https://stream.silvacast.com/RPLive/mp3-128/RadioPaloma_Homepage'),
    ] },
  { id: 'de-schlagerb2', name: 'Schlager Radio B2', country: 'DE', genre: 'schlager', mark: 'B2', hue: 340,
    alt: 'Шлягер радио Берлин Бранденбург',
    qualities: [
      q(192, 'https://addrad.io/4454rnz'),
    ] },
  { id: 'de-technobase', name: 'TechnoBase.FM', country: 'DE', genre: 'electronic', mark: 'TB', hue: 270,
    alt: 'Техно база',
    qualities: [
      q(192, 'https://listener3.mp3.tb-group.fm/tb.mp3', 'https://listen.technobase.fm/tunein-mp3'),
      q(256, 'https://listen.technobase.fm/tunein-aac-hd', 'http://listen.technobase.fm/tunein-aac-hd'),
    ] },
  { id: 'de-housetime', name: 'HouseTime.FM', country: 'DE', genre: 'house', mark: 'HT', hue: 175,
    alt: 'Хаус тайм',
    qualities: [
      q(192, 'https://listen.housetime.fm/tunein-mp3', 'http://listen.housetime.fm/tunein-mp3'),
      q(256, 'https://listen.housetime.fm/tunein-aac-hd', 'http://listen.housetime.fm/tunein-aac-hd'),
    ] },
  { id: 'de-dlf', name: 'Deutschlandfunk', country: 'DE', genre: 'news', mark: 'DF', hue: 215,
    alt: 'Дойчландфунк новости',
    qualities: [
      q(128, 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3', 'http://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3'),
      q(192, 'https://st01.sslstream.dlf.de/dlf/01/high/aac/stream.aac'),
    ] },
  { id: 'de-dlfkultur', name: 'Deutschlandfunk Kultur', country: 'DE', genre: 'talk', mark: 'DK', hue: 25,
    alt: 'Дойчландфунк культур',
    qualities: [
      q(128, 'https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3', 'http://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3'),
      q(256, 'https://st02.sslstream.dlf.de/dlf/02/high/aac/stream.aac'),
    ] },
  { id: 'de-brklassik', name: 'BR-KLASSIK', country: 'DE', genre: 'classical', mark: 'BK', hue: 232,
    alt: 'БР классик Баварское радио',
    qualities: [
      q(128, 'https://dispatcher.rndfnk.com/br/brklassik/live/mp3/mid'),
      q(256, 'https://dispatcher.rndfnk.com/br/brklassik/live/mp3/high'),
    ] },
];
