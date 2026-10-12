// ГЕНЕРИРУЕТСЯ: node tools/gen-catalog.mjs — собирает станции из stations/*.js. Руками правь файлы в stations/, не этот.
import S0 from './stations/ru.js';
import S1 from './stations/ru-new-a.js';
import S2 from './stations/ru-new-b.js';
import S3 from './stations/ru-new-c.js';
import S4 from './stations/us.js';
import S5 from './stations/gb.js';
import S6 from './stations/gb-base.js';
import S7 from './stations/de.js';
import S8 from './stations/fr.js';
import S9 from './stations/it.js';
import S10 from './stations/es.js';
import S11 from './stations/nl.js';
import S12 from './stations/pl.js';
import S13 from './stations/se.js';
import S14 from './stations/tr.js';
import S15 from './stations/ua.js';
import S16 from './stations/by.js';
import S17 from './stations/kz.js';
import S18 from './stations/uz.js';
import S19 from './stations/am.js';
import S20 from './stations/az.js';
import S21 from './stations/ge.js';
import S22 from './stations/cn.js';
import S23 from './stations/jp.js';
import S24 from './stations/kr.js';
import S25 from './stations/in.js';
import S26 from './stations/ae.js';
import S27 from './stations/cm.js';
import S28 from './stations/br.js';
import S29 from './stations/mx.js';
import S30 from './stations/ar.js';
import S31 from './stations/ca.js';
import S32 from './stations/au.js';
export { GENRES } from './stations/genres.js';
export { COUNTRIES } from './stations/countries.js';

export const STATIONS = [...S0, ...S1, ...S2, ...S3, ...S4, ...S5, ...S6, ...S7, ...S8, ...S9, ...S10, ...S11, ...S12, ...S13, ...S14, ...S15, ...S16, ...S17, ...S18, ...S19, ...S20, ...S21, ...S22, ...S23, ...S24, ...S25, ...S26, ...S27, ...S28, ...S29, ...S30, ...S31, ...S32];

// У каких станций есть файл логотипа (остальным окно рисует букву, лишних запросов не делает).
export const LOGOS = new Set(["ae-abudhabifm","ae-djradio","ae-emaratfm","ae-luv1071","ae-skynewsarabia","am-kissfm","am-lav","am-lavmix","am-marshall","am-mfm","am-van","am-xfm","ar-disney","ar-la100","ar-lared","ar-mega","ar-metro","ar-mitre","ar-mucha","ar-popradio","ar-rivadavia","ar-rockandpop","au-doublej","au-fresh927","au-kiis1065","au-newsradio","au-nova100","au-nova969","au-skynews","au-smooth953","au-triplej","au-triplem","au-triplemclassicrock","avtoradio","az-anti","az-asan","az-autolife","az-ictimai","az-mediafm","az-mediajazz","az-realfm","az-vintage","az-xezer","az-yurd","bbc1xtra","bfm","br-89fm","br-bandnews","br-bhfm","br-cbn","br-globo","br-jpnews","br-mixfm","br-sertaneja1067","br-transamerica","by-centerfm","by-dushevnoe","by-humorfm","by-novoeradio","by-radiusfm","by-relax","ca-cbc1","ca-cbcmusic","ca-cfox","ca-djfm","ca-edge","ca-q107","chanson","chansonromantic","chansonuncensored","chocolate","club101","cm-crtv-poste","cm-suellaba","cn-cri-news","cn-phoenix-info","comedy","dacha","de-1live","de-antenne","de-brklassik","de-dlf","de-dlfkultur","de-housetime","de-paloma","de-rockantenne","de-schlagerb2","de-swr3","de-technobase","detskoe","dfm","dfm-disco90","dfm-russiandance","dorognoe","energy","es-cadena100","es-dial","es-flaix","es-los40","es-los40dance","es-los40urban","es-ondacero","es-radio3","es-rne","es-rockfm","es-ser","europaplus","fr-fipelectro","fr-fipjazz","fr-franceinfo","fr-franceinter","fr-francemusique","fr-funradio","fr-ouifm","fr-radioclassique","fr-rfm","fr-rtl","fr-skyrock","fr-tsfjazz","gb-absolute","gb-bbc5live","gb-bbc6music","gb-bbcasian","gb-bbcradio1","gb-bbcradio1dance","gb-bbcradio2","gb-bbcradio3","gb-bbcradio4","gb-bbcradio4extra","gb-bbcworld","gb-capital","gb-capitaldance","gb-capitalxtra","gb-classicfm","gb-gold","gb-heart","gb-kiss","gb-kissdance","gb-magic","gb-naimjazz","gb-radiox","gb-rinse","gb-smooth","gb-talksport2","gb-timesradio","ge-chveneburi","ge-positive","ge-tbilisifm","govoritmoskva","hermitage","hitfm","humor","in-air-malayalam","in-air-punjabi","in-gaane-purane","in-mirchi-hindi","in-mirchi-love","in-mirchi-top20","in-vividh","it-deejay","it-freccia","it-m2o","it-radio105","it-rai1","it-rai2","it-rai3","it-raiclassica","it-rtl1025","it-virgin","it-virginclassic","jazz","jp-gensokyo","jp-japanhits","jp-jpopsakura","jp-listenmoe","jp-nhkworld","jp-shonanbeach","kommersant","kpradio","kr-arirang","kr-cbsmusic","kr-gugak","kr-ifm","kr-listenmoe-kpop","kr-obs","kr-ytn","kz-aspan","kz-avtoradio","kz-businessfm","kz-rusradio","kz-shalqar","kz-tengri","kz-vashe","kz-zhanafm","kz-zhuldyz","likefm","love","maximum","mayak","mir","montecarlo","mv","mx-alfa","mx-exa","mx-ibero","mx-kebuena","mx-laz","mx-los40","mx-mvs","mx-universal","mx-wradio","nashe","nl-3fm","nl-538","nl-538dance","nl-arrow","nl-qmusic","nl-radio1","nl-radio2","nl-radio4","nl-veronica","novoe","pl-antyradio","pl-eska","pl-eskarock","pl-polskieradio24","pl-radio357","pl-radiozet","pl-rmffm","pl-tokfm","pl-voxfm","pl-zloteprzeboje","radio7","radiord","radonezh","rec-1980","rec-bighits","rec-chil","rec-chillhouse","rec-club","rec-deep","rec-drumhits","rec-dub","rec-eurodance","rec-fut","rec-gold","rec-hype","rec-lofi","rec-mix","rec-phonk","rec-pump","rec-rap","rec-rapclassics","rec-record00","rec-reggae","rec-rock","rec-rus","rec-russiangold","rec-rv19","rec-sd90","rec-techno","rec-techouse","rec-teo","rec-trancehits","rec-trap","record","relax","retro","retro70","retro80","retro90","rockfm","romantika","rossii","rusradio","russiandance101","se-mixmegapol","se-nrj","se-rockklassiker","se-sr-dingata","se-sr-p1","se-sr-p2","se-sr-p3","se-sr-p4plus","se-sr-p4sthlm","silver","sputnik","strana","tr-alemfm","tr-arabeskinmerkezi","tr-haberturkradyo","tr-joyfm","tr-kralfm","tr-ntvradyo","tr-powerfm","tr-powerturk","tr-radyoeksen","tr-trtturku","ua-avtoradio","ua-djfm","ua-hitfm","ua-kissfm","ua-luxfm","ua-melodiafm","ua-nasheradio","ua-radionv","ua-radiorelax","ua-radioroks","ultra","unost","us-181-blues","us-181-eagle","us-181-oldschool","us-adroitjazz","us-bootliquor","us-classicvinyl","us-cnn","us-defcon","us-gotradio-hiphop","us-groovesalad","us-hardrockheaven","us-highway181","us-hot108","us-jazz24","us-kcrw","us-kexp","us-kusc","us-npr","us-nuevozol","us-planethiphop","us-power181","us-radioparadise","us-reggae","us-rp-rock","us-secretagent","us-wbez","us-wbgo","us-wqxr","us-wwoz","uz-hitfm","uz-markaz","uz-oriat","uz-qalbimnavosi","vestifm","zvezda"]);

export const shown = (s) => { const v = s.qualities.filter((x) => !x.hide); return v.length ? v : s.qualities.slice(-1); };
export const maxKbps = (s) => shown(s).at(-1).kbps;

// Пользовательский порядок станций (ids из хранилища); новые станции — в конец.
export const sortByOrder = (ids = [], list = STATIONS) => {
  const pos = new Map(ids.map((id, i) => [id, i]));
  const rank = (s) => pos.get(s.id) ?? 1000 + STATIONS.indexOf(s);
  return [...list].sort((a, b) => rank(a) - rank(b));
};
// Сохранённое качество могло устареть — тогда берём лучшее из доступных.
export const pickKbps = (s, wanted, saver = false) => (shown(s).some((q) => q.kbps === wanted) ? wanted : saver ? shown(s)[0].kbps : maxKbps(s));
export const stationsOf = (cc) => STATIONS.filter((s) => s.country === cc);
