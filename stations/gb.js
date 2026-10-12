import { q, hid, hls } from './lib.js';
// Страна: GB (Великобритания). Проверено 2026-10-12, из России.
// BBC: akamaized HLS (128 и 320 kbps AAC) + запасной ABR-плейлист a.files.bbci.co.uk (HE-AAC ~96 kbps).
// Global (media-ssl / media-ice / media-the .musicradio.com): MP3 128. Bauer (hellorayo): параметр aw_0_1st.skey — статичная рекламная метка, не токен.
const AK = 'https://as-hls-ww-live.akamaized.net';
const bbc = (pool, slug) => `${AK}/${pool}/live/ww/${slug}/${slug}.isml/${slug}-audio%3d`;
const ABR = 'https://a.files.bbci.co.uk/ms6/live/3441A116-B12E-4D2F-ACA8-C1984642FA4B/audio/simulcast/hls/nonuk/pc_hd_abr_v2/ak/';
const bbcQ = (pool, slug) => [
  hid(96, { url: `${ABR}${slug}.m3u8`, hls: true }),
  hls(128, `${bbc(pool, slug)}128000.norewind.m3u8`),
  hls(320, `${bbc(pool, slug)}320000.norewind.m3u8`),
];
const GL = (name) => ['ssl', 'ice', 'the'].map((h) => `https://media-${h}.musicradio.com/${name}`);
const K = 'aw_0_1st.skey=1602676850';

export default [
  { id: 'gb-bbcradio1', name: 'BBC Radio 1', country: 'GB', genre: 'pop', mark: '1', hue: 350, alt: 'Би-би-си Радио 1 бибиси хиты',
    qualities: bbcQ('pool_01505109', 'bbc_radio_one') },
  { id: 'gb-bbcradio1dance', name: 'BBC Radio 1 Dance', country: 'GB', genre: 'dance', mark: '1D', hue: 300, alt: 'Би-би-си Радио 1 Дэнс танцы',
    qualities: bbcQ('pool_62063831', 'bbc_radio_one_dance') },
  { id: 'gb-bbcradio2', name: 'BBC Radio 2', country: 'GB', genre: 'rockpop', mark: '2', hue: 28, alt: 'Би-би-си Радио 2 бибиси',
    qualities: bbcQ('pool_74208725', 'bbc_radio_two') },
  { id: 'gb-bbcradio3', name: 'BBC Radio 3', country: 'GB', genre: 'classical', mark: '3', hue: 355, alt: 'Би-би-си Радио 3 классика бибиси',
    qualities: bbcQ('pool_23461179', 'bbc_radio_three') },
  { id: 'gb-bbcradio4', name: 'BBC Radio 4', country: 'GB', genre: 'talk', mark: '4', hue: 215, alt: 'Би-би-си Радио 4 бибиси новости разговорное',
    qualities: bbcQ('pool_55057080', 'bbc_radio_fourfm') },
  { id: 'gb-bbcradio4extra', name: 'BBC Radio 4 Extra', country: 'GB', genre: 'humor', mark: '4X', hue: 200, alt: 'Би-би-си Радио 4 Экстра комедия радиоспектакли',
    qualities: bbcQ('pool_26173715', 'bbc_radio_four_extra') },
  { id: 'gb-bbc5live', name: 'BBC Radio 5 Live', country: 'GB', genre: 'sport', mark: '5', hue: 185, alt: 'Би-би-си Радио 5 Лайв новости спорт бибиси',
    qualities: bbcQ('pool_89021708', 'bbc_radio_five_live') },
  { id: 'gb-bbc6music', name: 'BBC Radio 6 Music', country: 'GB', genre: 'alternative', mark: '6', hue: 120, alt: 'Би-би-си Радио 6 Мьюзик альтернатива инди бибиси',
    qualities: bbcQ('pool_81827798', 'bbc_6music') },
  { id: 'gb-bbcasian', name: 'BBC Asian Network', country: 'GB', genre: 'world', mark: 'A', hue: 310, alt: 'Би-би-си Азиатская сеть бибиси',
    qualities: bbcQ('pool_22108647', 'bbc_asian_network') },
  { id: 'gb-bbcworld', name: 'BBC World Service', country: 'GB', genre: 'news', mark: 'WS', hue: 5, alt: 'Би-би-си Ворлд Сервис мировая служба бибиси новости',
    qualities: bbcQ('pool_87948813', 'bbc_world_service') },

  { id: 'gb-capital', name: 'Capital UK', country: 'GB', genre: 'pop', mark: 'C', hue: 215, alt: 'Кэпитал Капитал Лондон хиты',
    qualities: [q(128, ...GL('CapitalMP3'))] },
  { id: 'gb-capitalxtra', name: 'Capital XTRA', country: 'GB', genre: 'hiphop', mark: 'CX', hue: 235, alt: 'Кэпитал Экстра хип-хоп R&B гараж',
    qualities: [q(128, ...GL('CapitalXTRANationalMP3'))] },
  { id: 'gb-capitaldance', name: 'Capital Dance', country: 'GB', genre: 'dance', mark: 'CD', hue: 270, alt: 'Кэпитал Дэнс танцевальная',
    qualities: [q(128, ...GL('CapitalDanceMP3'))] },
  { id: 'gb-heart', name: 'Heart UK', country: 'GB', genre: 'pop', mark: 'H', hue: 345, alt: 'Харт Хартс Лондон',
    qualities: [q(128, ...GL('HeartUKMP3'))] },
  { id: 'gb-classicfm', name: 'Classic FM', country: 'GB', genre: 'classical', mark: 'fM', hue: 0, alt: 'Классик ФМ классическая музыка',
    qualities: [q(128, ...GL('ClassicFMMP3'))] },
  { id: 'gb-gold', name: 'Gold', country: 'GB', genre: 'oldies', mark: 'G', hue: 42, alt: 'Голд золотые хиты ретро',
    qualities: [q(128, ...GL('GoldMP3'))] },
  { id: 'gb-smooth', name: 'Smooth Radio', country: 'GB', genre: 'lounge', mark: 'S', hue: 275, alt: 'Смуз радио Смус',
    qualities: [q(128, ...GL('SmoothUKMP3'))] },
  { id: 'gb-radiox', name: 'Radio X', country: 'GB', genre: 'rock', mark: 'X', hue: 130, alt: 'Радио Икс рок инди',
    qualities: [q(128, ...GL('RadioXUKMP3'))] },

  { id: 'gb-absolute', name: 'Absolute Radio', country: 'GB', genre: 'rock', mark: 'AR', hue: 260, alt: 'Абсолют радио Эбсолют рок',
    qualities: [q(128, `https://stream-ar.hellorayo.co.uk/absoluteradiohigh.aac?direct=true&${K}`, `http://stream-ar.planetradio.co.uk/absoluteradiohigh.aac?${K}`)] },
  { id: 'gb-kiss', name: 'Kiss UK', country: 'GB', genre: 'dance', mark: 'K', hue: 320, alt: 'Кисс Кис Лондон танцевальная хиты',
    qualities: [q(112, 'https://live-kiss.sharp-stream.com/kiss100.mp3')] },
  { id: 'gb-kissdance', name: 'KISS Dance', country: 'GB', genre: 'dance', mark: 'KD', hue: 240, alt: 'Кисс Дэнс',
    qualities: [q(128, `https://stream-kiss.hellorayo.co.uk/kissdance.aac?direct=true&${K}`, `https://stream-kiss.hellorayo.co.uk/kissdance.aac?${K}`)] },
  { id: 'gb-magic', name: 'Magic Radio', country: 'GB', genre: 'hits', mark: 'M', hue: 215, alt: 'Мэджик радио Мэджик хиты',
    qualities: [q(112, `https://stream-mz.hellorayo.co.uk/magicnational.mp3?direct=true&${K}`, `https://stream-mz.hellorayo.co.uk/magicnational.mp3?${K}`)] },

  { id: 'gb-rinse', name: 'Rinse FM', country: 'GB', genre: 'electronic', mark: 'R', hue: 0, alt: 'Ринс ФМ драм-н-бейс гараж грайм',
    qualities: [q(128, 'https://admin.stream.rinse.fm/proxy/rinse_uk/stream')] },
  { id: 'gb-linnjazz', name: 'Linn Jazz', country: 'GB', genre: 'jazz', mark: 'LJ', hue: 30, alt: 'Линн Джаз',
    qualities: [q(320, 'http://radio.linn.co.uk:8000/autodj', 'http://mscp3.live-streams.nl:8340/jazz-high.aac')] },
  { id: 'gb-linnclassical', name: 'Linn Classical', country: 'GB', genre: 'classical', mark: 'LC', hue: 50, alt: 'Линн Классика',
    qualities: [q(320, 'http://radio.linn.co.uk:8004/autodj')] },
  { id: 'gb-timesradio', name: 'Times Radio', country: 'GB', genre: 'news', mark: 'T', hue: 200, alt: 'Таймс радио новости',
    qualities: [q(128, 'https://timesradio.wireless.radio/stream')] },
  { id: 'gb-talksport2', name: 'talkSPORT 2', country: 'GB', genre: 'sport', mark: 'T2', hue: 100, alt: 'ток спорт 2 футбол',
    qualities: [q(128, 'https://talksport.live.stream.broadcasting.news/stream2')] },
];
