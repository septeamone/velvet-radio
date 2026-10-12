import { q, hid, hls, HR } from './lib.js';
// Франция: FR. Проверено 2026-10-12, из России.
// Radio France: 128 (MP3) и 192 (AAC), https + http-вариант того же хоста.
const RF = (slug) => [
  q(128, `https://icecast.radiofrance.fr/${slug}-midfi.mp3`, `http://icecast.radiofrance.fr/${slug}-midfi.mp3`),
  q(192, `https://icecast.radiofrance.fr/${slug}-hifi.aac`, `http://icecast.radiofrance.fr/${slug}-hifi.aac`),
];
export default [
  { id: 'fr-rfm', name: 'RFM', country: 'FR', genre: 'pop', mark: 'RF', hue: 15,
    alt: 'РФМ Франция',
    qualities: [
      q(128, 'https://stream.rfm.fr/rfm.mp3', 'http://stream.rfm.fr/rfm.mp3', 'https://stream.rfm.fr/rfm.aac'),
    ] },
  { id: 'fr-funradio', name: 'Fun Radio', country: 'FR', genre: 'dance', mark: 'FR', hue: 305,
    alt: 'Фан радио',
    qualities: [
      q(128, 'https://icecast.funradio.fr/fun-1-44-128', 'http://icecast.funradio.fr/fun-1-44-128'),
    ] },
  { id: 'fr-skyrock', name: 'Skyrock', country: 'FR', genre: 'hiphop', mark: 'Sk', hue: 0,
    alt: 'Скайрок рэп',
    qualities: [
      q(128, 'http://icecast.skyrock.net/s/natio_mp3_128k', 'https://icecast.skyrock.net/s/natio_aac_128k'),
    ] },
  { id: 'fr-ouifm', name: 'OUI FM', country: 'FR', genre: 'rock', mark: 'OU', hue: 12,
    alt: 'Уи ФМ рок Франция',
    qualities: [
      q(128, 'https://ouifm.ice.infomaniak.ch/ouifm-high.mp3', 'http://ouifm.ice.infomaniak.ch/ouifm-high.mp3'),
    ] },
  { id: 'fr-rtl', name: 'RTL', country: 'FR', genre: 'talk', mark: 'RT', hue: 355,
    alt: 'РТЛ Франция',
    qualities: [
      q(128, 'https://icecast.rtl.fr/rtl-1-44-128'),
    ] },
  { id: 'fr-franceinfo', name: 'franceinfo', country: 'FR', genre: 'news', mark: 'fi', hue: 200,
    alt: 'Франс инфо новости',
    qualities: RF('franceinfo') },
  { id: 'fr-franceinter', name: 'France Inter', country: 'FR', genre: 'talk', mark: 'FI', hue: 350,
    alt: 'Франс Интер',
    qualities: RF('franceinter') },
  { id: 'fr-fipelectro', name: 'FIP Electro', country: 'FR', genre: 'electronic', mark: 'FE', hue: 280,
    alt: 'ФИП электро',
    qualities: RF('fipelectro') },
  { id: 'fr-tsfjazz', name: 'TSF Jazz', country: 'FR', genre: 'jazz', mark: 'TJ', hue: 38,
    alt: 'ТСФ джаз',
    qualities: [
      q(128, 'https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3', 'http://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3'),
    ] },
  { id: 'fr-fipjazz', name: 'FIP Jazz', country: 'FR', genre: 'jazz', mark: 'FJ', hue: 215,
    alt: 'ФИП джаз',
    qualities: RF('fipjazz') },
  { id: 'fr-francemusique', name: 'France Musique', country: 'FR', genre: 'classical', mark: 'FM', hue: 330,
    alt: 'Франс Мюзик',
    qualities: RF('francemusique') },
  { id: 'fr-radioclassique', name: 'Radio Classique', country: 'FR', genre: 'classical', mark: 'RC', hue: 42,
    alt: 'Радио Классик',
    qualities: [
      q(128, 'https://str0.creacast.com/classique1', 'https://radioclassique.ice.infomaniak.ch/radioclassique-high.mp3'),
    ] },
];
