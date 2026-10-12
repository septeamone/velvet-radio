import { q, hid, hls, HR } from './lib.js';
// Мексика: MX. Проверено 2026-10-12, из России. StreamTheWorld + Radio Fórmula (HLS) + Ibero.
const T = (name) => HR('playerservices.streamtheworld.com', `api/livestream-redirect/${name}`);
export default [
  { id: 'mx-kebuena', name: 'La Ke Buena 92.9', country: 'MX', genre: 'regional', mark: 'KB', hue: 20, alt: 'Ла Ке Буэна Мехико регионал мексикана банда',
    qualities: [q(128, ...T('KEBUENA.mp3')), q(192, ...T('KEBUENAAAC.aac'))] },
  { id: 'mx-laz', name: 'La Z 107.3', country: 'MX', genre: 'regional', mark: 'Z', hue: 340, alt: 'Ла Зета Мехико регионал мексикана',
    qualities: [q(128, ...T('XEQR_FMAAC.aac'))] },
  { id: 'mx-alfa', name: 'Alfa 91.3', country: 'MX', genre: 'pop', mark: 'Al', hue: 210, alt: 'Альфа 91.3 Мехико поп',
    qualities: [q(128, ...T('XHFAJ_FMAAC.aac'))] },
  { id: 'mx-los40', name: 'LOS40 México', country: 'MX', genre: 'pop', mark: '40', hue: 15, alt: 'Лос 40 Мексика хиты',
    qualities: [q(128, ...T('LOS40_MEXICO_SC'))] },
  { id: 'mx-exa', name: 'Exa FM 104.9', country: 'MX', genre: 'pop', mark: 'Ex', hue: 280, alt: 'Экса ФМ Мехико поп',
    qualities: [q(128, ...T('XHEXA_SC'))] },
  { id: 'mx-universal', name: 'Universal 88.1', country: 'MX', genre: 'rockpop', mark: 'U', hue: 175, alt: 'Универсал 88.1 Мехико',
    qualities: [q(128, ...T('XHFO_FMAAC.aac'))] },
  { id: 'mx-ibero', name: 'Ibero 90.9', country: 'MX', genre: 'alternative', mark: 'Ib', hue: 120, alt: 'Иберо 90.9 Мехико рок альтернатива',
    qualities: [q(128, 'http://noasrv.caster.fm:10182/live')] },
  { id: 'mx-formula', name: 'Radio Fórmula 103.3', country: 'MX', genre: 'news', mark: 'RF', hue: 230, alt: 'Радио Формула Мехико новости',
    qualities: [hls(128, 'https://mdstrm.com/audio/6102ce7ef33d0b0830ec3adc/live.m3u8')] },
  { id: 'mx-wradio', name: 'W Radio', country: 'MX', genre: 'news', mark: 'W', hue: 50, alt: 'Дабл-ю радио Мехико новости',
    qualities: [q(128, ...T('W_RADIO.mp3')), q(192, ...T('W_RADIOAAC.aac'))] },
  { id: 'mx-mvs', name: 'MVS Noticias 102.5', country: 'MX', genre: 'news', mark: 'MV', hue: 0, alt: 'МВС Нотисиас Мехико новости',
    qualities: [q(128, ...T('XHMVSFM_SC'))] },
];
