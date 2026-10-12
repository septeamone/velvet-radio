import { q } from './lib.js';
// Украина: UA. Проверено 2026-10-12, из России.
export default [
  { id: 'ua-hitfm', name: 'Хіт FM (Hit FM)', country: 'UA', genre: 'hits', mark: 'ХІ', hue: 6, alt: 'Хит ФМ Украина хиты',
    qualities: [
      q(128, 'https://online.hitfm.ua/HitFM', 'http://online.hitfm.ua/HitFM', 'http://195.95.206.17/HitFM'),
      q(320, 'https://online.hitfm.ua/HitFM_HD', 'http://online.hitfm.ua/HitFM_HD'),
    ] },
  { id: 'ua-kissfm', name: 'Kiss FM', country: 'UA', genre: 'dance', mark: 'KS', hue: 330, alt: 'Кисс ФМ Украина',
    qualities: [
      q(128, 'https://online.kissfm.ua/KissFM', 'http://online.kissfm.ua/KissFM'),
      q(320, 'https://online.kissfm.ua/KissFM_HD', 'http://online.kissfm.ua/KissFM_HD'),
    ] },
  { id: 'ua-radioroks', name: 'Radio ROKS', country: 'UA', genre: 'rock', mark: 'RK', hue: 18, alt: 'Радио Рокс Украина рок',
    qualities: [
      q(128, 'https://online.radioroks.ua/RadioROKS', 'http://online.radioroks.ua/RadioROKS'),
      q(320, 'https://online.radioroks.ua/RadioROKS_HD', 'http://online.radioroks.ua/RadioROKS_HD'),
    ] },
  { id: 'ua-nasheradio', name: 'Наше Радіо (Nashe Radio)', country: 'UA', genre: 'rockpop', mark: 'НР', hue: 175, alt: 'Наше Радио Украина',
    qualities: [
      q(128, 'https://online.nasheradio.ua/NasheRadio', 'http://online.nasheradio.ua/NasheRadio'),
      q(320, 'https://online.nasheradio.ua/NasheRadio_HD', 'http://online.nasheradio.ua/NasheRadio_HD'),
    ] },
  { id: 'ua-luxfm', name: 'Люкс ФМ (Lux FM)', country: 'UA', genre: 'pop', mark: 'ЛФ', hue: 12, alt: 'Люкс ФМ Украина поп',
    qualities: [
      q(128, 'http://lux.radio.tvstitch.com/kyiv/lux_adv_sd', 'https://lux.radio.tvstitch.com/kyiv/lux_adv_sd'),
    ] },
  { id: 'ua-melodiafm', name: 'Мелодія FM (Melodia FM)', country: 'UA', genre: 'retro', mark: 'МФ', hue: 340, alt: 'Мелодия ФМ Украина ретро',
    qualities: [
      q(128, 'https://online.melodiafm.ua/MelodiaFM', 'http://online.melodiafm.ua/MelodiaFM'),
      q(320, 'https://online.melodiafm.ua/MelodiaFM_HD', 'http://online.melodiafm.ua/MelodiaFM_HD'),
    ] },
  { id: 'ua-djfm', name: 'DJ FM (DJFM.UA)', country: 'UA', genre: 'electronic', mark: 'DJ', hue: 55, alt: 'ДиДжей ФМ Украина электроника',
    qualities: [
      q(256, 'https://cast.fex.net/djfm_x', 'http://cast.fex.net/djfm_x'),
    ] },
  { id: 'ua-avtoradio', name: 'Авторадіо (Avtoradio)', country: 'UA', genre: 'hits', mark: 'АР', hue: 215, alt: 'Авторадио Украина',
    qualities: [
      q(128, 'https://cast.mediaonline.net.ua/avtoradio', 'http://cast.mediaonline.net.ua/avtoradio'),
    ] },
  { id: 'ua-radiorelax', name: 'Radio Relax', country: 'UA', genre: 'chill', mark: 'RL', hue: 195, alt: 'Радио Релакс Украина',
    qualities: [
      q(128, 'https://online.radiorelax.ua/RadioRelax', 'http://online.radiorelax.ua/RadioRelax'),
      q(320, 'https://online.radiorelax.ua/RadioRelax_HD', 'http://online.radiorelax.ua/RadioRelax_HD'),
    ] },
  { id: 'ua-radionv', name: 'Радіо НВ (Radio NV)', country: 'UA', genre: 'news', mark: 'НВ', hue: 290, alt: 'Радио НВ Украина новости разговорное',
    qualities: [
      q(128, 'https://online-radio.nv.ua/radionv.mp3', 'http://91.218.212.84:8000/radionv.mp3'),
    ] },
];
