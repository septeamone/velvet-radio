import { q } from './lib.js';
// Швеция: SE. Проверено 2026-10-12, из России.
// Sveriges Radio (адреса из официального api.sr.se): mp3-96 отдаёт ~128 kbps, aac-320 — настоящие 320.
export default [
  { id: 'se-sr-p3', name: 'Sveriges Radio P3', country: 'SE', genre: 'pop', mark: 'P3', hue: 150, alt: 'Шведское радио П3 Швеция поп',
    qualities: [q(128, 'https://live1.sr.se/p3-mp3-96'), q(320, 'https://live1.sr.se/p3-aac-320', 'https://edge1.sr.se/p3-aac-320')] },
  { id: 'se-sr-p4sthlm', name: 'Sveriges Radio P4 Stockholm', country: 'SE', genre: 'hits', mark: 'P4', hue: 300, alt: 'Шведское радио П4 Стокгольм',
    qualities: [q(128, 'https://live1.sr.se/p4sth-mp3-96'), q(320, 'https://live1.sr.se/p4sth-aac-320', 'https://edge1.sr.se/p4sth-aac-320')] },
  { id: 'se-mixmegapol', name: 'Mix Megapol', country: 'SE', genre: 'hits', mark: 'MM', hue: 350, alt: 'Микс Мегапол Швеция хиты',
    qualities: [q(128, 'https://live-bauerse-fm.sharp-stream.com/mixmegapol_instream_se_mp3', 'http://tx-bauerse.sharp-stream.com/http_live.php?i=mixmegapol_instream_se_mp3')] },
  { id: 'se-nrj', name: 'NRJ Sweden', country: 'SE', genre: 'dance', mark: 'NR', hue: 0, alt: 'Энерджи Швеция NRJ',
    qualities: [q(128, 'https://live-bauerse-fm.sharp-stream.com/nrj_instreamtest_se_mp3', 'http://tx-bauerse.sharp-stream.com/http_live.php?i=nrj_instreamtest_se_mp3')] },
  { id: 'se-sr-dingata', name: 'Sveriges Radio P3 Din gata', country: 'SE', genre: 'hiphop', mark: 'DG', hue: 130, alt: 'П3 Дин гата хип-хоп Швеция',
    qualities: [q(128, 'https://live1.sr.se/dingata-mp3-96'), q(320, 'https://live1.sr.se/dingata-aac-320')] },
  { id: 'se-rockklassiker', name: '106,7 Rockklassiker', country: 'SE', genre: 'rock', mark: 'RK', hue: 15, alt: 'Роккласикер Швеция рок',
    qualities: [q(128, 'https://live-bauerse-fm.sharp-stream.com/rockklassiker_instream_se_mp3', 'http://tx-bauerse.sharp-stream.com/http_live.php?ua=WEB&i=rockklassiker_instream_se_mp3')] },
  { id: 'se-sr-p4plus', name: 'Sveriges Radio P4 Plus', country: 'SE', genre: 'oldies', mark: 'P+', hue: 280, alt: 'П4 Плюс Швеция',
    qualities: [q(128, 'https://live1.sr.se/p4plus-mp3-96'), q(320, 'https://live1.sr.se/p4plus-aac-320')] },
  { id: 'se-sr-p1', name: 'Sveriges Radio P1', country: 'SE', genre: 'news', mark: 'P1', hue: 215, alt: 'Шведское радио П1 новости',
    qualities: [q(128, 'https://live1.sr.se/p1-mp3-96'), q(320, 'https://live1.sr.se/p1-aac-320', 'https://edge1.sr.se/p1-aac-320')] },
  { id: 'se-sr-p2', name: 'Sveriges Radio P2 Klassiskt', country: 'SE', genre: 'classical', mark: 'P2', hue: 22, alt: 'Шведское радио П2 классика',
    qualities: [q(128, 'https://live1.sr.se/p2-mp3-96'), q(320, 'https://live1.sr.se/p2-aac-320', 'https://edge1.sr.se/p2-aac-320')] },
];
