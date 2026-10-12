import { q, hls } from './lib.js';
// Турция: TR. Проверено 2026-10-12, из России.
// У HLS-эфира бывает несколько хостов, поэтому объект с несколькими адресами собран вручную.
const hlsM = (kbps, ...urls) => ({ kbps, urls, hls: true });
export default [
  { id: 'tr-powerturk', name: 'Power Türk', country: 'TR', genre: 'pop', mark: 'PT', hue: 350, alt: 'Пауэр Тюрк турецкий поп',
    qualities: [
      hlsM(128, 'https://live.powerapp.com.tr/powerturk/abr/powerturk/128/playlist.m3u8', 'https://listen.powerapp.com.tr/powerturk/128/chunks.m3u8'),
      hlsM(256, 'https://listen.powerapp.com.tr/powerturk/abr/powerturk/256/playlist.m3u8', 'https://live.powerapp.com.tr/powerturk/abr/powerturk/256/playlist.m3u8', 'https://listen.powerapp.com.tr/powerturk/256/chunks.m3u8'),
    ] },
  { id: 'tr-kralfm', name: 'Kral FM', country: 'TR', genre: 'pop', mark: 'KR', hue: 210, alt: 'Крал ФМ турецкий поп',
    qualities: [
      hls(128, 'https://dygedge2.radyotvonline.net/kralfm/playlist.m3u8'),
    ] },
  { id: 'tr-powerfm', name: 'Power FM', country: 'TR', genre: 'hits', mark: 'PF', hue: 45, alt: 'Пауэр ФМ Турция хиты',
    qualities: [
      hlsM(128, 'https://live.powerapp.com.tr/powerfm/abr/powerfm/128/playlist.m3u8', 'https://listen.powerapp.com.tr/powerfm/abr/powerfm/128/playlist.m3u8'),
      hlsM(256, 'https://listen.powerapp.com.tr/powerfm/abr/powerfm/256/playlist.m3u8', 'https://live.powerapp.com.tr/powerfm/abr/powerfm/256/playlist.m3u8', 'https://listen.powerapp.com.tr/powerfm/256/chunks.m3u8'),
    ] },
  { id: 'tr-joyfm', name: 'Joy FM', country: 'TR', genre: 'hits', mark: 'JF', hue: 220, alt: 'Джой ФМ Турция',
    qualities: [
      q(128, 'http://21633.live.streamtheworld.com/JOY_FM128AAC.aac', 'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM128AAC.aac'),
    ] },
  { id: 'tr-alemfm', name: 'Alem FM', country: 'TR', genre: 'pop', mark: 'AL', hue: 28, alt: 'Алем ФМ Турция',
    qualities: [
      q(128, 'https://turkmedya.radyotvonline.net/alemfmaac'),
    ] },
  { id: 'tr-radyoeksen', name: 'Radyo Eksen', country: 'TR', genre: 'rockpop', mark: 'EK', hue: 52, alt: 'Радио Эксен Турция рок поп',
    qualities: [
      hls(128, 'https://dygedge.radyotvonline.net/radyoeksen/playlist.m3u8'),
      q(224, 'http://eksenwmp.radyotvonline.com/;stream.mp3'),
    ] },
  { id: 'tr-trtturku', name: 'TRT Türkü', country: 'TR', genre: 'folk', mark: 'TT', hue: 8, alt: 'ТРТ Тюркю турецкий фолк народная музыка',
    qualities: [
      hlsM(128, 'https://rd-trtturku.medya.trt.com.tr/master_128.m3u8', 'https://rd-trtturku.medya.trt.com.tr/master.m3u8'),
    ] },
  { id: 'tr-arabeskinmerkezi', name: 'Arabeskin Merkezi FM', country: 'TR', genre: 'arabic', mark: 'AM', hue: 275, alt: 'Арабеск Меркези ФМ арабеск Турция',
    qualities: [
      q(128, 'http://canli.arabeskinmerkezi.com:9180/stream'),
    ] },
  { id: 'tr-haberturkradyo', name: 'Habertürk Radyo', country: 'TR', genre: 'news', mark: 'HT', hue: 355, alt: 'Хабертюрк радио новости Турция',
    qualities: [
      q(128, 'https://haberturkradyo.radyotvonline.net/haberturkradyo'),
    ] },
  { id: 'tr-ntvradyo', name: 'NTV Radyo', country: 'TR', genre: 'news', mark: 'NT', hue: 32, alt: 'НТВ радио новости Турция',
    qualities: [
      q(128, 'http://ntvrdwmp.radyotvonline.com/'),
    ] },
];
