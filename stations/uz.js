import { q, hid, hls } from './lib.js';
// Страна: UZ (Узбекистан). Проверено 2026-10-12, из России.
export default [
  { id: 'uz-oriat', name: 'Oriat Dono (Oriat FM)', country: 'UZ', genre: 'hits', mark: 'Or', hue: 25,
    alt: 'Ориат ФМ Ориат Дано Oriat Dono Ташкент русские и узбекские хиты',
    qualities: [q(320, 'http://194.5.152.248:8000/fm', 'http://live.oriatdono.uz:8000/fm')] },
  { id: 'uz-qalbimnavosi', name: "Qalbim Navosi (Қалбим наваси)", country: 'UZ', genre: 'love', mark: 'QN', hue: 340,
    alt: 'Калбим наваси Кальбим Навоси Алo ФМ A\'LO FM Табассум Ташкент узбекская эстрада',
    qualities: [q(96, 'http://s1.muz.uz:9000/alo_low', 'http://tabassum.uz:9000/alo_low', 'http://ns10.jethost.uz:8000/qalbimnavosi', 'http://s1.muz.uz:9000/qalbimnavosi')] },
  { id: 'uz-hitfm', name: 'Hit FM Uzbekistan (Yoshlar Ovozi)', country: 'UZ', genre: 'hits', mark: 'H', hue: 210,
    alt: 'Хит ФМ Узбекистан Ёшлар овози Яшлар Овози Yoshlar Ovozi Ташкент хиты',
    qualities: [q(96, 'http://ns10.jethost.uz:8000/yoshlarovoziaac', 'http://ns10.jethost.uz:8000/hitfmuz')] },
  { id: 'uz-markaz', name: 'Radio Markaz', country: 'UZ', genre: 'mix', mark: 'Mk', hue: 150,
    alt: 'Радио Марказ Markaz Ташкент',
    qualities: [q(96, 'http://mediamarkaz.com:8000/radiomarkaz')] },
  { id: 'uz-islom', name: 'Islom.uz Radio', country: 'UZ', genre: 'religious', mark: 'Is', hue: 125,
    alt: 'Ислом уз Радио Ислам Islom uz духовное Коран лекции',
    qualities: [q(128, 'https://radio.islom.uz/islomuz')] },
];
