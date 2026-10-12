import { q, hid, hls } from './lib.js';
// Китай: CN. Проверено 2026-10-12, из России.
// CNR отдаёт эфиры по HLS с двух хостов (ngcdn001 / ngcdn002) — они считаются зеркалами. CORS нет (визуализатора не будет).
const H = (url) => ({ url, hls: true });
const CNR = (code) => [H(`https://ngcdn001.cnr.cn/live/${code}/index.m3u8`), H(`https://ngcdn002.cnr.cn/live/${code}/index.m3u8`), H(`http://ngcdn002.cnr.cn/live/${code}/index.m3u8`)];
export default [
  { id: 'cn-cnr1', name: 'CNR-1 中国之声 (China National Radio, The Voice of China)', country: 'CN', genre: 'news', mark: '中', hue: 0,
    alt: 'Китайское национальное радио 1 Голос Китая чжунго чжишэн CNR One новости Китай',
    qualities: [q(192, ...CNR('zgzs'))] },
  { id: 'cn-cnr2', name: 'CNR-2 经济之声 (CNR Business Radio)', country: 'CN', genre: 'business', mark: '经', hue: 20,
    alt: 'Китайское радио 2 экономика цзинцзи чжишэн CNR Economic Voice бизнес',
    qualities: [q(192, ...CNR('jjzs'))] },
  { id: 'cn-cnr3', name: 'CNR-3 音乐之声 (CNR Music Radio)', country: 'CN', genre: 'cpop', mark: '乐', hue: 330,
    alt: 'Китайское радио 3 Голос музыки иньюэ чжишэн C-pop китайская поп музыка CNR Music',
    qualities: [q(192, ...CNR('yyzs'))] },
  { id: 'cn-cnr-arts', name: 'CNR 文艺之声 (CNR Arts Radio)', country: 'CN', genre: { ru: 'Культура и традиции', en: 'Culture & tradition' }, mark: '艺', hue: 280,
    alt: 'Китайское радио вэньи чжишэн искусство культура опера традиционная музыка CNR Literature Art',
    qualities: [q(192, ...CNR('wyzs'))] },
  { id: 'cn-cnr-city', name: 'CNR 都市之声 (CNR Urban Radio)', country: 'CN', genre: 'talk', mark: '都', hue: 210,
    alt: 'Китайское радио ду ши чжишэн городское радио городская жизнь CNR City Voice',
    qualities: [q(192, ...CNR('dszs'))] },
  { id: 'cn-cri-news', name: 'CRI 环球资讯广播 (China Radio International News)', country: 'CN', genre: 'news', mark: 'CR', hue: 355,
    alt: 'Международное радио Китая CRI хуаньцю цзысюнь новости Радио Китая для зарубежья',
    qualities: [q(256, H('https://sk.cri.cn/905.m3u8'), H('http://sk.cri.cn/905.m3u8'))] },
  { id: 'cn-chinaplus', name: 'CGTN Radio / China Plus (CRI English)', country: 'CN', genre: 'news', mark: 'CP', hue: 190,
    alt: 'Китай плюс CGTN радио английский новости China Plus Radio CRI English Service',
    qualities: [q(256, H('https://sk.cri.cn/am846.m3u8'), H('http://sk.cri.cn/am846.m3u8'))] },
  { id: 'cn-asiafm-hot', name: 'AsiaFM 亚洲热歌台 (AsiaFM Hot Hits)', country: 'CN', genre: 'cpop', mark: 'AH', hue: 350,
    alt: 'Азия ФМ Asia FM горячие хиты Яочжоу рэ гэ тай китайская поп музыка Mandopop',
    qualities: [q(192, 'http://hot.asiafm.net:8000/asiafm', 'http://asiafm.hk:8000/asiafm')] },
  { id: 'cn-asiafm-gold', name: 'AsiaFM 亚洲经典台 (AsiaFM Gold)', country: 'CN', genre: 'oldies', mark: 'AG', hue: 45,
    alt: 'Азия ФМ Asia FM золотые хиты классика китайская ретро Gold Cantonese',
    qualities: [q(128, 'http://goldfm.cn:8000/goldfm')] },
  { id: 'cn-phoenix-info', name: '凤凰卫视资讯台 (Phoenix InfoNews)', country: 'CN', genre: 'news', mark: '凤', hue: 15,
    alt: 'Феникс ТВ Phoenix Info News Fenghuang InfoNews новости Гонконг фэнхуан',
    qualities: [q(128, H('https://playtv-live.ifeng.com/live/06OLEEWQKN4_audio.m3u8'), H('http://playtv-live.ifeng.com/live/06OLEEWQKN4_audio.m3u8'))] },
];
