import { q, hid, hls, HR } from './lib.js';
// Канада: CA. Проверено 2026-10-12, из России.
const T = (name) => HR('playerservices.streamtheworld.com', `api/livestream-redirect/${name}`);
const LS = (call) => HR('live.leanstream.co', `${call}-MP3`);
export default [
  { id: 'ca-cbc1', name: 'CBC Radio One Toronto', country: 'CA', genre: 'news', mark: 'C1', hue: 5, alt: 'Си-би-си Радио 1 Торонто новости',
    qualities: [q(128, 'https://26733.live.streamtheworld.com/CBLAFM_CBC_SC', ...T('CBLAFM_CBC_SC'))] },
  { id: 'ca-cbcmusic', name: 'CBC Music Toronto', country: 'CA', genre: 'mix', mark: 'CM', hue: 20, alt: 'Си-би-си Мьюзик Торонто',
    qualities: [q(128, 'https://26373.live.streamtheworld.com/CBLFM_CBC_SC', ...T('CBLFM_CBC_SC'))] },
  { id: 'ca-icipremiere', name: 'ICI Radio-Canada Première Montréal', country: 'CA', genre: 'news', mark: 'IP', hue: 355, alt: 'Радио-Канада Премьер Монреаль новости',
    qualities: [q(128, ...T('CBFFM_SRC.mp3'))] },
  { id: 'ca-icimusique', name: 'ICI Musique Montréal', country: 'CA', genre: 'mix', mark: 'IM', hue: 330, alt: 'Радио-Канада Мюзик Монреаль',
    qualities: [q(128, ...T('CBFXFM_SRC.mp3'))] },
  { id: 'ca-q107', name: 'Q107 Toronto', country: 'CA', genre: 'rock', mark: 'Q', hue: 12, alt: 'Кью 107 Торонто классик-рок',
    qualities: [q(128, ...LS('CILQFM'))] },
  { id: 'ca-edge', name: '102.1 The Edge', country: 'CA', genre: 'rock', mark: 'E', hue: 270, alt: 'Эдж 102.1 Торонто рок альтернатива',
    qualities: [q(128, ...LS('CFNYFM'))] },
  { id: 'ca-cfox', name: 'CFOX 99.3', country: 'CA', genre: 'rock', mark: 'Fx', hue: 35, alt: 'Си-эф-окс Ванкувер рок',
    qualities: [q(128, ...LS('CFOXFM'))] },
  { id: 'ca-indie88', name: 'Indie88', country: 'CA', genre: 'indie', mark: 'I8', hue: 190, alt: 'Инди 88 Торонто',
    qualities: [q(128, 'https://localradio.streamb.live/SB00348')] },
  { id: 'ca-boom973', name: 'Boom 97.3', country: 'CA', genre: 'hits', mark: 'B', hue: 48, alt: 'Бум 97.3 Торонто хиты',
    qualities: [q(128, 'https://newcap.leanstream.co/CHBMFM', 'http://newcap.leanstream.co/CHBMFM')] },
  { id: 'ca-hot899', name: 'Hot 89.9', country: 'CA', genre: 'pop', mark: 'H', hue: 345, alt: 'Хот 89.9 Оттава поп',
    qualities: [q(128, 'https://newcap.leanstream.co/CIHTFM', 'http://newcap.leanstream.co/CIHTFM')] },
  { id: 'ca-djfm', name: 'DJFM', country: 'CA', genre: 'electronic', mark: 'DJ', hue: 295, alt: 'Ди-джей ФМ Монреаль электроника',
    qualities: [q(128, 'https://mux.mtl.djfmradio.com/djfm', 'http://mux.mtl.djfmradio.com/djfm')] },
];
