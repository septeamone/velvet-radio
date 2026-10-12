import { q, hid, hls } from './lib.js';
// Страна/группа: US. Проверено 2026-10-12, из России (probe: живое аудио). Битрейты заявленные (адрес / icy-br / radio-browser).
const S = (n, kb, hosts) => hosts.map((h) => `https://ice${h}.somafm.com/${n}-${kb}-mp3`);
const STW = (c) => [`https://playerservices.streamtheworld.com/api/livestream-redirect/${c}.mp3`, `https://playerservices.streamtheworld.com/api/livestream-redirect/${c}_SC`];
const F181 = (n) => [`https://listen.181fm.com/181-${n}_128k.mp3`, `http://listen.181fm.com/181-${n}_128k.mp3`];
const RP = (n, k) => [`https://stream.radioparadise.com/${n}-${k}`, `http://stream.radioparadise.com/${n}-${k}`];

export default [
  // --- Кантри ---
  { id: 'us-977country', name: '.977 Country', country: 'US', genre: 'country', mark: 'C', hue: 30,
    alt: 'кантри 977 кантри америка',
    qualities: [q(128, ...STW('977_COUNTRY'), 'http://26343.live.streamtheworld.com/977_COUNTRY_SC')] },
  { id: 'us-highway181', name: '181.FM Highway 181', country: 'US', genre: 'country', mark: 'H', hue: 44,
    alt: 'хайвей 181 кантри',
    qualities: [q(128, ...F181('highway'))] },
  { id: 'us-bootliquor', name: 'SomaFM Boot Liquor', country: 'US', genre: 'country', mark: 'BL', hue: 18,
    alt: 'сома буткантри альт-кантри американа',
    qualities: [q(128, ...S('bootliquor', 128, [1, 2])), q(320, ...S('bootliquor', 320, [1, 5, 4]))] },

  // --- Хип-хоп / олд-скул / R&B ---
  { id: 'us-hot108', name: 'Hot 108 Jamz', country: 'US', genre: 'hiphop', mark: 'H1', hue: 350,
    alt: 'хот 108 джемз хип хоп рэп',
    qualities: [q(128, 'http://sc.hot108.com:4000/')] },
  { id: 'us-planethiphop', name: 'Planet HipHop (MRG.fm)', country: 'US', genre: 'hiphop', mark: 'PH', hue: 270,
    alt: 'планет хип хоп рэп',
    qualities: [q(128, 'http://listen.mrg.fm:8100/stream')] },
  { id: 'us-gotradio-hiphop', name: 'GotRadio Hip Hop Stop', country: 'US', genre: 'hiphop', mark: 'GR', hue: 0,
    alt: 'готрадио хип хоп стоп рэп',
    qualities: [q(128, 'https://pureplay.cdnstream1.com/6041_128.mp3', 'http://pureplay.cdnstream1.com/6041_128.mp3')] },
  { id: 'us-181-oldschool', name: '181.FM Old School HipHop & R&B', country: 'US', genre: 'oldschool', mark: 'OS', hue: 38,
    alt: 'олдскул хип хоп ар-н-би олд скул 181',
    qualities: [q(128, ...F181('oldschool'))] },
  { id: 'us-977jamz', name: '.977 Jamz', country: 'US', genre: 'rnb', mark: 'J', hue: 305,
    alt: 'джемз ар-н-би урбан соул',
    qualities: [q(128, ...STW('977_JAMZ'), 'http://26343.live.streamtheworld.com/977_JAMZ_SC')] },

  // --- Поп / Top 40 ---
  { id: 'us-977hitz', name: '.977 Hitz', country: 'US', genre: 'hits', mark: 'Hz', hue: 330,
    alt: 'хитс топ 40 поп хиты сша',
    qualities: [q(128, ...STW('977_HITS'), 'http://18853.live.streamtheworld.com:3690/977_HITS_SC')] },
  { id: 'us-power181', name: '181.FM Power 181 (Top 40)', country: 'US', genre: 'pop', mark: 'P', hue: 345,
    alt: 'пауэр 181 топ 40 поп',
    qualities: [q(128, ...F181('power'))] },

  // --- Рок / метал / альтернатива ---
  { id: 'us-hardrockheaven', name: 'Hard Rock Heaven', country: 'US', genre: 'rock', mark: 'HR', hue: 10,
    alt: 'хард рок хевен тяжёлый рок',
    qualities: [q(128, 'http://hydra.cdnstream.com/1521_128')] },
  { id: 'us-rp-rock', name: 'Radio Paradise Rock Mix', country: 'US', genre: 'rock', mark: 'RR', hue: 120,
    alt: 'радио парадайз рок микс',
    qualities: [q(128, ...RP('rock', 128)), q(320, ...RP('rock', 320))] },
  { id: 'us-kexp', name: 'KEXP 90.3 Seattle', country: 'US', genre: 'alternative', mark: 'K', hue: 50,
    alt: 'кексп сиэтл инди альтернатива',
    qualities: [q(128, 'http://live-mp3-128.kexp.org/kexp128.mp3'), q(160, 'https://kexp.streamguys1.com/kexp160.aac')] },
  { id: 'us-wfmu', name: 'WFMU 91.1', country: 'US', genre: 'alternative', mark: 'WF', hue: 80,
    alt: 'вфму фримформ независимое радио нью-джерси',
    qualities: [q(128, 'http://stream2.wfmu.org/freeform-128k'), q(256, 'https://stream0.wfmu.org/freeform-extrahigh-primary.aac')] },
  { id: 'us-kcrw', name: 'KCRW 89.9', country: 'US', genre: 'indie', mark: 'KC', hue: 200,
    alt: 'кейси арту лос анджелес эклектика инди',
    qualities: [q(192, 'https://streams.kcrw.com/kcrw_mp3', 'http://streams.kcrw.com/kcrw_mp3')] },

  // --- Классический рок / олдис ---
  { id: 'us-181-eagle', name: '181.FM The Eagle (Classic Rock)', country: 'US', genre: 'rock', mark: 'E', hue: 22,
    alt: 'иглс классик рок классический рок',
    qualities: [q(128, ...F181('eagle'))] },
  { id: 'us-classicvinyl', name: 'Classic Vinyl HD (WALM)', country: 'US', genre: 'oldies', mark: 'CV', hue: 60,
    alt: 'классик винил золотые хиты 60 70 рок',
    qualities: [q(320, 'https://icecast.walmradio.com:8443/classic')] },

  // --- Джаз / блюз ---
  { id: 'us-jazz24', name: 'Jazz24', country: 'US', genre: 'jazz', mark: 'J24', hue: 215,
    alt: 'джаз 24 сиэтл',
    qualities: [q(128, 'https://knkx-live-a.edge.audiocdn.com/6285_128k'), q(256, 'https://knkx-live-a.edge.audiocdn.com/6285_256k')] },
  { id: 'us-wbgo', name: 'WBGO Jazz 88.3', country: 'US', genre: 'jazz', mark: 'WB', hue: 235,
    alt: 'вбго джаз нью-арк нью-йорк',
    qualities: [q(128, 'https://ais-sa8.cdnstream1.com/3629_128.mp3')] },
  { id: 'us-adroitjazz', name: 'Adroit Jazz Underground (WALM)', country: 'US', genre: 'jazz', mark: 'AJ', hue: 195,
    alt: 'адроит джаз андеграунд',
    qualities: [q(320, 'https://icecast.walmradio.com:8443/jazz')] },
  { id: 'us-101smoothjazz', name: '101 Smooth Jazz', country: 'US', genre: 'jazz', mark: 'SJ', hue: 175,
    alt: 'смуз джаз',
    qualities: [q(192, 'http://jking.cdnstream1.com/b22139_128mp3')] },
  { id: 'us-181-blues', name: '181.FM True Blues', country: 'US', genre: 'blues', mark: 'B', hue: 225,
    alt: 'тру блюз',
    qualities: [q(128, ...F181('blues'))] },
  { id: 'us-wwoz', name: 'WWOZ 90.7 New Orleans', country: 'US', genre: { ru: 'Новоорлеанская музыка', en: 'New Orleans music' }, mark: 'OZ', hue: 285,
    alt: 'вводз новый орлеан джаз блюз',
    qualities: [q(128, 'http://wwoz-sc.streamguys.com/wwoz-hi.mp3')] },

  // --- Классика ---
  { id: 'us-kusc', name: 'Classical KUSC', country: 'US', genre: 'classical', mark: 'KU', hue: 255,
    alt: 'кьюск классика лос анджелес',
    qualities: [q(256, 'https://playerservices.streamtheworld.com/api/livestream-redirect/KUSCMP256.mp3')] },
  { id: 'us-wqxr', name: 'WQXR 105.9 New York', country: 'US', genre: 'classical', mark: 'WQ', hue: 245,
    alt: 'вкйксэр классика нью-йорк',
    qualities: [q(128, 'https://stream.wqxr.org/wqxr-web')] },

  // --- Электроника / чилл / лаунж / регги ---
  { id: 'us-groovesalad', name: 'SomaFM Groove Salad', country: 'US', genre: 'chill', mark: 'GS', hue: 150,
    alt: 'сома груув салат чил даунтемпо',
    qualities: [q(128, ...S('groovesalad', 128, [1, 2, 4])), q(256, ...S('groovesalad', 256, [1, 4, 6]))] },
  { id: 'us-defcon', name: 'SomaFM DEF CON Radio', country: 'US', genre: 'electronic', mark: 'DC', hue: 0,
    alt: 'сома дефкон электроника',
    qualities: [q(128, ...S('defcon', 128, [1])), q(256, ...S('defcon', 256, [1, 4, 6]))] },
  { id: 'us-pulseedm', name: 'PulseEDM Dance Music Radio', country: 'US', genre: 'dance', mark: 'PE', hue: 290,
    alt: 'пульс эдм танцевальная',
    qualities: [q(128, 'http://pulseedm.cdnstream1.com:8124/1373_128')] },
  { id: 'us-secretagent', name: 'SomaFM Secret Agent', country: 'US', genre: 'lounge', mark: 'SA', hue: 35,
    alt: 'сома секретный агент лаунж шпион',
    qualities: [q(128, ...S('secretagent', 128, [1, 2, 4]))] },
  { id: 'us-reggae', name: 'SomaFM Heavyweight Reggae', country: 'US', genre: 'reggae', mark: 'HW', hue: 100,
    alt: 'сома регги',
    qualities: [q(128, ...S('reggae', 128, [1])), q(256, ...S('reggae', 256, [1, 4]))] },

  // --- Радио Paradise (основной микс) ---
  { id: 'us-radioparadise', name: 'Radio Paradise Main Mix', country: 'US', genre: 'mix', mark: 'RP', hue: 130,
    alt: 'радио парадайз основной микс эклектика',
    qualities: [q(128, ...RP('aac', 128)), q(320, ...RP('aac', 320), 'http://stream.radioparadise.com/mp3-320')] },

  // --- Латино ---
  { id: 'us-mega963', name: 'Mega 96.3 Los Angeles', country: 'US', genre: 'latin', mark: 'M', hue: 15,
    alt: 'мега 96.3 лос анджелес латино испанский',
    qualities: [q(128, 'https://liveaudio.lamusica.com/LA_KXOL_icy')] },
  { id: 'us-nuevozol', name: 'El Nuevo Zol 106.7 Miami', country: 'US', genre: 'latin', mark: 'Z', hue: 320,
    alt: 'эль нуэво соль зол майами латино',
    qualities: [q(320, 'https://liveaudio.lamusica.com/MIA_WXDJ_icy')] },

  // --- Новости ---
  { id: 'us-npr', name: 'NPR Program Stream', country: 'US', genre: 'news', mark: 'N', hue: 5,
    alt: 'нпр национальное публичное радио новости',
    qualities: [q(96, 'http://npr-ice.streamguys1.com/live.mp3')] },
  { id: 'us-cnn', name: 'CNN Audio', country: 'US', genre: 'news', mark: 'CN', hue: 358,
    alt: 'си-эн-эн новости',
    qualities: [q(96, 'https://tunein.cdnstream1.com/2868_96.mp3')] },
  { id: 'us-wbez', name: 'WBEZ 91.5 Chicago', country: 'US', genre: 'news', mark: 'WZ', hue: 210,
    alt: 'вибиз чикаго новости публичное радио',
    qualities: [q(128, 'http://stream.wbez.org/wbez128.mp3')] },
];
