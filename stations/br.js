import { q, hid, hls, HR } from './lib.js';
// Бразилия: BR. Проверено 2026-10-12, из России. Почти всё — StreamTheWorld (играет без токенов).
const T = (name) => HR('playerservices.streamtheworld.com', `api/livestream-redirect/${name}`);
const SERTANEJO = { ru: 'Сертанежу', en: 'Sertanejo' };
const MPB = { ru: 'МПБ (бразильская песня)', en: 'MPB' };
export default [
  { id: 'br-89fm', name: '89 FM A Rádio Rock', country: 'BR', genre: 'rock', mark: '89', hue: 8, alt: '89 фм радио рок Сан-Паулу',
    qualities: [hid(96, ...T('RADIO_89FM.mp3')), q(128, ...T('RADIO_89FM_ADP.aac'))] },
  { id: 'br-kissfm', name: 'Kiss FM 92.5', country: 'BR', genre: 'rock', mark: 'K', hue: 345, alt: 'Кисс ФМ Сан-Паулу рок',
    qualities: [hid(96, ...T('RADIO_KISSFM.mp3')), q(128, ...T('RADIO_KISSFM_ADP.aac'))] },
  { id: 'br-mixfm', name: 'Mix FM', country: 'BR', genre: 'pop', mark: 'Mx', hue: 300, alt: 'Микс ФМ Сан-Паулу',
    qualities: [q(96, ...T('MIXFM_SAOPAULO.mp3'))] },
  { id: 'br-transamerica', name: 'Rádio Transamérica', country: 'BR', genre: 'pop', mark: 'Tr', hue: 200, alt: 'Трансамерика',
    qualities: [q(128, ...T('RT_SP.mp3'))] },
  { id: 'br-globo', name: 'Rádio Globo', country: 'BR', genre: 'hits', mark: 'G', hue: 215, alt: 'Радио Глобо Рио-де-Жанейро',
    qualities: [q(128, ...T('RADIO_GLOBO_RJAAC.aac'), ...T('RADIO_GLOBO_RJ.mp3'))] },
  { id: 'br-sertaneja1067', name: 'Sertaneja 106.7', country: 'BR', genre: SERTANEJO, mark: 'Se', hue: 38, alt: 'Сертанежа сертанежу',
    qualities: [q(128, 'https://sc4s.cdn.upx.com:8067/stream')] },
  { id: 'br-bhfm', name: 'BH FM', country: 'BR', genre: SERTANEJO, mark: 'BH', hue: 140, alt: 'Бело-Оризонти БХ ФМ сертанежу пагоде',
    qualities: [q(128, ...T('BHFM.mp3'), ...T('BHFMAAC.aac'))] },
  { id: 'br-batuta', name: 'Rádio Batuta', country: 'BR', genre: MPB, mark: 'Ba', hue: 55, alt: 'Радио Батута МПБ бразильская музыка',
    qualities: [q(128, 'http://radioims.out.airtime.pro:8000/radioims_a')] },
  { id: 'br-cbn', name: 'CBN São Paulo', country: 'BR', genre: 'news', mark: 'CB', hue: 0, alt: 'ЦБН Сан-Паулу новости',
    qualities: [q(128, ...T('CBN_SPAAC.aac'), ...T('CBN_SP.mp3'))] },
  { id: 'br-bandnews', name: 'BandNews FM', country: 'BR', genre: 'news', mark: 'BN', hue: 25, alt: 'Бэнд Ньюс ФМ новости',
    qualities: [q(96, ...T('BANDNEWSFM_SP.mp3'))] },
  { id: 'br-jpnews', name: 'Jovem Pan News', country: 'BR', genre: 'news', mark: 'JP', hue: 90, alt: 'Жовем Пан Ньюс новости',
    qualities: [q(128, 'https://stream.zeno.fm/vlcraijc6yiuv')] },
];
