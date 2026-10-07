// qualities — по возрастанию kbps; в каждом urls[] — основной поток и резервные зеркала того же качества.
// kbps — РЕАЛЬНЫЙ битрейт потока (замерен), а не то, что написано в названии потока.
// hide: true — качество не показывается кнопкой, а используется только как «страховка» при падении потока.
const q = (kbps, ...urls) => ({ kbps, urls });
const hid = (kbps, ...urls) => ({ kbps, urls, hide: true });
const hls = (kbps, url) => ({ kbps, urls: [url], hls: true });

const BBC = 'https://as-hls-ww-live.akamaized.net/pool_92079267/live/ww/bbc_1xtra/bbc_1xtra.isml/bbc_1xtra-audio%3d';
const HR = (host, path) => [`https://${host}/${path}`, `http://${host}/${path}`]; // один сервер по https и по http

export const STATIONS = [
  { id: 'europaplus', name: 'Europa Plus', genre: 'Поп', mark: 'E+', hue: 340, qualities: [
    q(128, 'https://europaplus.hostingradio.ru:8014/europaplus320.mp3', 'https://retro.hostingradio.ru:8014/europaplus320.mp3', 'https://ep256.hostingradio.ru:8052/europaplus256.mp3', 'http://ep128server.streamr.ru:8030/ep128', 'https://ep128.hostingradio.ru:8030/ep128'),
    hls(192, 'https://hls-02-europaplus.emgsound.ru/11/192/playlist.m3u8'),
    q(320, 'https://europaplussrc.hostingradio.ru:8014/europaplus320.mp3', 'https://europaplussrc.hostingradio.ru:8014/europaplus320f.mp3', 'http://europaplussrc.hostingradio.ru:8014/europaplus320.mp3', 'https://emgregion.hostingradio.ru:8064/moscow.europaplus.mp3')] },
  { id: 'record', name: 'Radio Record', genre: 'Танцы', mark: 'R', hue: 8, qualities: [
    hid(96, ...HR('radiorecord.hostingradio.ru', 'rr_main96.aacp')),
    hls(112, 'https://hls-01-radiorecord.hostingradio.ru/record/112/playlist.m3u8'),
    q(320, 'http://recordsrc.hostingradio.ru:9010/rr_main')] },
  { id: 'bbc1xtra', name: 'BBC Radio 1Xtra', genre: 'Электроника', mark: '1X', hue: 280, qualities: [
    hls(128, `${BBC}128000.norewind.m3u8`), hls(320, `${BBC}320000.norewind.m3u8`)] },
  { id: 'retro', name: 'Ретро FM', genre: 'Ретро', mark: 'Р', hue: 32, qualities: [
    q(128, 'http://retroserver.streamr.ru:8043/retro256.mp3', 'https://retro.hostingradio.ru:8014/retro320.mp3', 'https://europaplus.hostingradio.ru:8014/retro320.mp3', 'http://retro.hostingradio.ru:8043/retro128'),
    hls(192, 'https://hls-01-retro.emgsound.ru/12/192/playlist.m3u8'),
    q(320, 'https://europaplussrc.hostingradio.ru:8014/retro320.mp3', 'https://europaplussrc.hostingradio.ru:8014/retro320f.mp3', 'http://europaplussrc.hostingradio.ru:8014/retro320.mp3', 'https://emgregion.hostingradio.ru:8064/moscow.retrofm.mp3')] },
  { id: 'radio7', name: 'Радио 7', genre: 'Поп', mark: '7', hue: 190, qualities: [
    q(128, 'http://radio7server.streamr.ru:8040/radio7256.mp3', 'http://radio7.hostingradio.ru:8040/radio7256.mp3', 'https://europaplus.hostingradio.ru:8014/radiosept320.mp3', 'http://radio7server.streamr.ru:8040/radio7128.mp3'),
    hls(192, 'https://hls-01-radio7.emgsound.ru/13/192/playlist.m3u8'),
    q(320, 'https://europaplussrc.hostingradio.ru:8014/radiosept320.mp3', 'https://europaplussrc.hostingradio.ru:8014/radiosept320f.mp3', 'http://europaplussrc.hostingradio.ru:8014/radiosept320.mp3', 'https://emgregion.hostingradio.ru:8064/moscow.radio7.mp3')] },
  { id: 'dorognoe', name: 'Дорожное радио', genre: 'Хиты', mark: 'Д', hue: 48, qualities: [
    hid(64, 'http://dorognoe.hostingradio.ru:8000/dorognoe'),
    hls(192, 'https://hls-01-dorognoe.emgsound.ru/15/192/playlist.m3u8'),
    q(320, 'https://dorognoe.hostingradio.ru:8000/radio', 'https://europaplussrc.hostingradio.ru:8014/dorognoe320.mp3', 'http://dorognoe.hostingradio.ru:8000/radio', 'https://emgregion.hostingradio.ru:8064/moscow.dorognoe.mp3')] },
  { id: 'vestifm', name: 'Вести FM', genre: 'Новости', mark: 'В', hue: 215, qualities: [
    q(128, 'http://icecast.vgtrk.cdnvideo.ru/vestifm_mp3_128kbps', 'https://icecast-vgtrk.cdnvideo.ru/vestifm_mp3_128kbps'),
    q(192, 'http://icecast.vgtrk.cdnvideo.ru/vestifm_mp3_192kbps', 'https://icecast-vgtrk.cdnvideo.ru/vestifm_mp3_192kbps'),
    q(320, 'http://icecast.vgtrk.cdnvideo.ru/vestifm', 'https://icecast-vgtrk.cdnvideo.ru/vestifm')] },
  { id: 'mayak', name: 'Радио Маяк', genre: 'Новости', mark: 'М', hue: 0, qualities: [
    q(128, 'https://icecast-vgtrk.cdnvideo.ru/mayakfm_mp3_128kbps', 'http://icecast.vgtrk.cdnvideo.ru/mayakfm_mp3_128kbps'),
    q(192, 'https://icecast-vgtrk.cdnvideo.ru/mayakfm_mp3_192kbps', 'http://icecast.vgtrk.cdnvideo.ru/mayakfm_mp3_192kbps'),
    q(320, 'https://icecast-vgtrk.cdnvideo.ru/mayakfm', 'http://icecast.vgtrk.cdnvideo.ru/mayakfm')] },
  { id: 'bfm', name: 'Business FM', genre: 'Бизнес', mark: 'B', hue: 235, qualities: [
    q(256, 'https://bfm.hostingradio.ru:9075/fm', 'https://bfmreg.hostingradio.ru/fm', 'https://bfm.hostingradio.ru/bfm256.mp3', 'http://bfm.hostingradio.ru:8004/fm')] },
  { id: 'chanson', name: 'Радио Шансон', genre: 'Шансон', mark: 'Ш', hue: 20, qualities: [
    q(128, 'http://chanson.hostingradio.ru:8041/chanson128.mp3', 'https://chanson.hostingradio.ru:8041/chanson128.mp3'),
    q(256, 'http://chanson.hostingradio.ru:8041/chanson256.mp3', 'https://chanson.hostingradio.ru:8041/chanson256.mp3')] },
  { id: 'ultra', name: 'Radio Ultra', genre: 'Рок', mark: 'U', hue: 300, qualities: [
    q(128, 'http://nashe1.hostingradio.ru/ultra-128.mp3', 'http://nashe3.hostingradio.ru/ultra-128.mp3', 'https://nashe1.hostingradio.ru/ultra-128.mp3'),
    q(192, 'http://nashe1.hostingradio.ru/ultra-192.mp3', 'http://nashe3.hostingradio.ru/ultra-192.mp3', 'https://nashe1.hostingradio.ru/ultra-192.mp3'),
    q(256, 'http://nashe1.hostingradio.ru/ultra-256', 'http://nashe3.hostingradio.ru/ultra-256', 'http://main.hostingradio.ru/ultra-256', 'https://nashe1.hostingradio.ru/ultra-256')] },
  { id: 'nashe', name: 'Наше Радио', genre: 'Рок', mark: 'Н', hue: 0, qualities: [
    q(128, 'http://nashe1.hostingradio.ru/nashe-128.mp3', 'http://nashe3.hostingradio.ru/nashe-128.mp3', 'https://nashe1.hostingradio.ru/nashe-128.mp3'),
    q(256, 'http://nashe1.hostingradio.ru/nashe-256', 'http://nashe3.hostingradio.ru/nashe-256', 'https://main.hostingradio.ru/nashe-256', 'https://nashe1.hostingradio.ru/nashe-256')] },
  { id: 'rusradio', name: 'Русское Радио', genre: 'Русские хиты', mark: 'Р', hue: 355, qualities: [
    hid(96, 'https://rusradio.hostingradio.ru/rusradio96.aacp', 'https://icecast01.hostingradio.ru/rusradio96.aacp'),
    q(128, 'https://rusradio.hostingradio.ru/rusradio128.mp3', 'https://icecast01.hostingradio.ru/rusradio128.mp3', 'https://depechemode.hostingradio.ru/rusradio128.mp3', 'https://mc-mcgold.hostingradio.ru/rusradio128.mp3', 'http://rusradio.hostingradio.ru/rusradio128.mp3'),
    { ...hls(256, 'https://rusradio.ru/t/radio/master.m3u8'), note: '256 kbps — региональный эфир, музыка та же' }] },
  { id: 'dfm', name: 'Радио DFM', genre: 'Танцы', mark: 'D', hue: 265, qualities: [
    hid(96, 'https://dfm.hostingradio.ru/dfm96.aacp', 'https://icecast01.hostingradio.ru/dfm96.aacp'),
    q(128, 'https://dfm.hostingradio.ru/dfm128.mp3', 'https://icecast01.hostingradio.ru/dfm128.mp3', 'https://depechemode.hostingradio.ru/dfm128.mp3', 'https://mc-mcgold.hostingradio.ru/dfm128.mp3', 'http://dfm.hostingradio.ru/dfm128.mp3')] },
  { id: 'maximum', name: 'Радио Maximum', genre: 'Рок и поп', mark: 'Mx', hue: 25, qualities: [
    hid(96, 'https://maximum.hostingradio.ru/maximum96.aacp', 'https://icecast01.hostingradio.ru/maximum96.aacp'),
    q(128, 'https://maximum.hostingradio.ru/maximum128.mp3', 'https://icecast01.hostingradio.ru/maximum128.mp3', 'https://depechemode.hostingradio.ru/maximum128.mp3', 'https://mc-mcgold.hostingradio.ru/maximum128.mp3', 'http://maximum.hostingradio.ru/maximum128.mp3'),
    { ...hls(256, 'https://maximum.ru/t/maximum-omsk/master.m3u8'), note: '256 kbps — эфир Maximum Омск (своя реклама и новости)' }] },
  { id: 'hitfm', name: 'Хит FM', genre: 'Хиты', mark: 'Х', hue: 320, qualities: [
    hid(96, 'https://hitfm.hostingradio.ru/hitfm96.aacp', 'https://icecast01.hostingradio.ru/hitfm96.aacp'),
    q(128, 'https://hitfm.hostingradio.ru/hitfm128.mp3', 'https://icecast01.hostingradio.ru/hitfm128.mp3', 'https://depechemode.hostingradio.ru/hitfm128.mp3', 'https://mc-mcgold.hostingradio.ru/hitfm128.mp3', 'http://hitfm.hostingradio.ru/hitfm128.mp3')] },
  { id: 'montecarlo', name: 'Radio Monte Carlo', genre: 'Лаунж', mark: 'МК', hue: 45, qualities: [
    hid(96, 'https://montecarlo.hostingradio.ru/montecarlo96.aacp', 'https://icecast01.hostingradio.ru/montecarlo96.aacp'),
    q(128, 'https://montecarlo.hostingradio.ru/montecarlo128.mp3', 'https://icecast01.hostingradio.ru/montecarlo128.mp3', 'https://depechemode.hostingradio.ru/montecarlo128.mp3', 'https://mc-mcgold.hostingradio.ru/montecarlo128.mp3', 'http://montecarlo.hostingradio.ru/montecarlo128.mp3')] },
  { id: 'love', name: 'Love Radio', genre: 'Романтика', mark: 'L', hue: 335, qualities: [
    q(128, 'http://microit.n340.com:9000/VgMv0WV17ZVx1uuo_12_love_128_reg_44', 'https://stream2.n340.com/12_love_128_reg_44?type=aac&UID=1C254BF561F74C9BFDBAF0957371CB7B')] },
  { id: 'relax', name: 'Relax FM · Chill Out', genre: 'Чилаут', mark: 'Rx', hue: 170, qualities: [
    hid(64, 'https://pub0201.101.ru/stream/pro/aac/64/28'),
    q(128, 'https://pub0201.101.ru/stream/trust/mp3/128/24', 'https://srv01.gpmradio.ru/stream/trust/mp3/128/24', 'https://srv02.gpmradio.ru:8443/stream/trust/mp3/128/24', 'https://pub0101.101.ru/stream/trust/mp3/128/24')] },
  { id: 'zvezda', name: 'Радио Звезда', genre: 'Разное', mark: 'З', hue: 5, qualities: [
    q(128, 'https://icecast-zvezda.mediacdn.ru/radio/zvezda/zvezda_128', 'https://zvezda-radio-rzv.mediacdn.ru/radio/zvezda/zvezda_128')] },
  { id: 'comedy', name: 'Comedy Radio', genre: 'Юмор', mark: 'C', hue: 60, qualities: [
    hid(96, 'http://23.105.238.4/gpm-comedyradio495.aacp', 'http://rmg.hostingradio.ru/gpm-comedyradio495.aacp'),
    hls(128, 'https://hls-01-gpm.hostingradio.ru/comedyradio495/playlist.m3u8')] },
];

export const shown = (s) => s.qualities.filter((x) => !x.hide);
export const maxKbps = (s) => shown(s).at(-1).kbps;

// Пользовательский порядок станций (ids из хранилища); новые станции — в конец.
export const sortByOrder = (ids = []) => {
  const pos = new Map(ids.map((id, i) => [id, i]));
  const rank = (s) => pos.get(s.id) ?? 1000 + STATIONS.indexOf(s);
  return [...STATIONS].sort((a, b) => rank(a) - rank(b));
};
// Сохранённое качество могло устареть — тогда берём лучшее из доступных.
export const pickKbps = (s, wanted) => (shown(s).some((q) => q.kbps === wanted) ? wanted : maxKbps(s));
