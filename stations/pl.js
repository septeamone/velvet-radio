import { q, hls } from './lib.js';
// Польша: PL. Проверено 2026-10-12, из России.
export default [
  { id: 'pl-rmffm', name: 'RMF FM', country: 'PL', genre: 'pop', mark: 'RM', hue: 48, alt: 'РМФ ФМ Польша',
    qualities: [
      q(128, 'https://rs201-krk-cyfronet.rmfstream.pl/rmf_fm', 'http://195.150.20.242:8000/rmf_fm', 'http://31.192.216.8/rmf_fm', 'http://195.150.20.7/rmf_fm'),
    ] },
  { id: 'pl-radiozet', name: 'Radio ZET', country: 'PL', genre: 'pop', mark: 'ZE', hue: 346, alt: 'Радио Зет Польша',
    qualities: [
      q(128, 'https://zt.cdn.eurozet.pl/zet-tun.mp3', 'https://r.dcs.redcdn.pl/sc/o2/Eurozet/live/audio.livx?audio=5', 'https://n-11-21.dcs.redcdn.pl/sc/o2/Eurozet/live/audio.livx?audio=5'),
    ] },
  { id: 'pl-eska', name: 'Radio ESKA', country: 'PL', genre: 'hits', mark: 'ES', hue: 24, alt: 'Эска Польша',
    qualities: [
      q(128, 'https://waw.ic.smcdn.pl/2380-1.mp3', 'https://ic2.smcdn.pl/2380-1.mp3'),
    ] },
  { id: 'pl-voxfm', name: 'VOX FM', country: 'PL', genre: 'dance', mark: 'VX', hue: 214, alt: 'Вокс ФМ Польша',
    qualities: [
      q(128, 'https://ic2.smcdn.pl/3990-1.mp3', 'https://waw.ic.smcdn.pl/3990-1.mp3', 'http://ic2.smcdn.pl/3990-1.mp3'),
    ] },
  { id: 'pl-antyradio', name: 'Antyradio', country: 'PL', genre: 'rock', mark: 'AR', hue: 8, alt: 'Антирадио Польша',
    qualities: [
      q(128, 'https://n-4-2.dcs.redcdn.pl/sc/o2/Eurozet/live/antyradio.livx?audio=5', 'http://n-4-2.dcs.redcdn.pl/sc/o2/Eurozet/live/antyradio.livx?audio=5', 'https://n-4-4.dcs.redcdn.pl/sc/o2/Eurozet/live/antyradio.livx'),
    ] },
  { id: 'pl-eskarock', name: 'ESKA ROCK', country: 'PL', genre: 'rock', mark: 'ER', hue: 0, alt: 'Эска Рок Польша',
    qualities: [
      q(128, 'https://ic2.smcdn.pl/5380-1.mp3', 'https://waw.ic.smcdn.pl/5380-1.mp3', 'https://ic1.smcdn.pl/5380-1.mp3'),
    ] },
  { id: 'pl-tokfm', name: 'TOK FM', country: 'PL', genre: 'talk', mark: 'TF', hue: 240, alt: 'ТОК ФМ Польша разговорное',
    qualities: [
      q(128, 'https://radiostream.pl/tuba10-1.mp3', 'http://radiostream.pl/tuba10-1.mp3'),
    ] },
  { id: 'pl-polskieradio24', name: 'Polskie Radio 24', country: 'PL', genre: 'news', mark: 'P24', hue: 355, alt: 'Польское радио 24 новости',
    qualities: [
      hls(192, 'https://stream15.polskieradio.pl/pr24/pr24.sdp/playlist.m3u8'),
    ] },
  { id: 'pl-radio357', name: 'Radio 357', country: 'PL', genre: 'alternative', mark: '357', hue: 160, alt: 'Радио 357 Польша',
    qualities: [
      q(128, 'https://n-11-21.dcs.redcdn.pl/sc/o2/radio357/live/radio357_pr.livx?preroll=0', 'https://n-11-26.dcs.redcdn.pl/sc/o2/radio357/live/radio357_pr.livx?preroll=0'),
    ] },
  { id: 'pl-zloteprzeboje', name: 'Radio Złote Przeboje', country: 'PL', genre: 'oldies', mark: 'ZP', hue: 14, alt: 'Радио Злоте Пшебоје Польша золотые хиты',
    qualities: [
      q(128, 'https://radiostream.pl/tuba8904-1.mp3', 'http://radiostream.pl/tuba8904-1.mp3'),
    ] },
];
