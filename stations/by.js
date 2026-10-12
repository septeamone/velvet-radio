import { q } from './lib.js';
// Беларусь: BY. Проверено 2026-10-12, из России.
export default [
  { id: 'by-novoeradio', name: 'Новое радио (Novoe Radio)', country: 'BY', genre: 'pop', mark: 'НР', hue: 285, alt: 'Новое радио Беларусь Минск',
    qualities: [
      q(128, 'https://live.novoeradio.by:444/live/novoeradio_aac128/icecast.audio'),
    ] },
  { id: 'by-radiusfm', name: 'Радиус FM (Radius FM)', country: 'BY', genre: 'hits', mark: 'Р', hue: 50, alt: 'Радиус ФМ Беларусь Минск',
    qualities: [
      q(192, 'https://stream2.datacenter.by/radiusfm_main', 'http://stream2.datacenter.by/radiusfm_main'),
    ] },
  { id: 'by-rusradio', name: 'Русское радио Беларусь', country: 'BY', genre: 'rushits', mark: 'РР', hue: 5, alt: 'Русское радио Минск 98.9',
    qualities: [
      q(128, 'https://stream.rusradio.by:8443/live128', 'http://stream.rusradio.by:8000/live128'),
    ] },
  { id: 'by-legendyfm', name: 'Легенды FM (Legendy FM)', country: 'BY', genre: 'retro', mark: 'ЛФ', hue: 220, alt: 'Легенды ФМ Минск ретро',
    qualities: [
      q(192, 'http://live.legendy.by:8000/legendyfm'),
    ] },
  { id: 'by-roks', name: 'Радио ROKS (Radio Roks Belarus)', country: 'BY', genre: 'rock', mark: 'RK', hue: 15, alt: 'Радио Рокс Беларусь рок',
    qualities: [
      q(160, 'https://stream.roks.com:8443/live256', 'http://stream.roks.com:8000/live256'),
    ] },
  { id: 'by-humorfm', name: 'Юмор FM (Humor FM)', country: 'BY', genre: 'humor', mark: 'Ю', hue: 40, alt: 'Юмор ФМ Беларусь Веселое радио',
    qualities: [
      q(160, 'http://live.humorfm.by:8000/veseloeradio', 'https://live.humorfm.by:8443/veseloeradio'),
    ] },
  { id: 'by-relax', name: 'Радыё Relax', country: 'BY', genre: 'chill', mark: 'RL', hue: 195, alt: 'Радио Релакс Беларусь',
    qualities: [
      q(160, 'http://live.humorfm.by:8000/radiorelax', 'https://live.humorfm.by:8443/radiorelax'),
    ] },
  { id: 'by-centerfm', name: 'Центр FM (Center FM)', country: 'BY', genre: 'pop', mark: 'ЦФ', hue: 355, alt: 'Центр ФМ Беларусь',
    qualities: [
      q(192, 'https://stream2.datacenter.by/stream'),
    ] },
  { id: 'by-stalica', name: 'Радыё Сталіца (Radio Stalica)', country: 'BY', genre: 'talk', mark: 'С', hue: 160, alt: 'Радио Столица Минск',
    qualities: [
      q(256, 'https://media2.datacenter.by/stream/stalica/stream', 'http://media2.datacenter.by/stream/stalica/stream'),
    ] },
  { id: 'by-dushevnoe', name: 'Душевное радио (Dushevnoe Radio)', country: 'BY', genre: 'love', mark: 'Д', hue: 25, alt: 'Душевное радио Минск 105.7',
    qualities: [
      q(128, 'https://stream2.datacenter.by/dushevnoe'),
    ] },
];
