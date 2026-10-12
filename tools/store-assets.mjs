// Графика для Chrome Web Store: 5 скриншотов 1280×800, малая плитка 440×280 и картинка «Что нового» (ru и en).
//   node tools/store-assets.mjs [<папка>]     по умолчанию docs/store
// Скрыто и без звука. Играет настоящая станция (нужен интернет), чтобы на снимках были название песни и анализатор звука.
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? path.join(root, 'docs/store'));
const { STATIONS, COUNTRIES } = await import(pathToFileURL(path.join(root, 'stations.js')).href);
const nCountries = new Set(STATIONS.map((s) => s.country).filter((c) => c !== 'RU')).size;
const nStations = Math.floor(STATIONS.length / 10) * 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const T = {
  ru: {
    brand: 'Velvet Radio',
    shots: [
      { title: `Сотни станций<br>России и мира`, sub: `Россия и ${nCountries} стран, звук до 320 kbps. Играет в фоне, пока открыт Chrome.` },
      { title: `Страны мира<br>с флагами`, sub: `Поиск по-русски и по-английски: США, Великобритания, Германия, Китай и другие.` },
      { title: `Свои жанры<br>в каждой стране`, sub: `Кантри, хип-хоп, олд-скул, рок, джаз: самые популярные станции каждой страны.` },
      { title: `Название песни<br>и анализатор звука`, sub: `Видно, что играет прямо сейчас. Клик по названию ищет песню в Google.` },
      { title: `Всё под рукой`, sub: `Плавные переходы, экономия трафика, синхронизация, горячие клавиши и резервная копия.` },
    ],
    tile: `Радио России и мира`,
    newTitle: 'Что нового в 1.5',
    news: [`${nStations}+ станций: Россия и ${nCountries} стран`, 'Вкладка «Страны» с флагами, поиск на двух языках', 'Русский и английский интерфейс', 'Жанры, фильтры и названия песен прямо в списке', 'Плавные переходы между станциями', 'Синхронизация, резервная копия, настройки', 'Улучшена стабильность потока'],
  },
  en: {
    brand: 'Velvet Radio',
    shots: [
      { title: `Hundreds of stations<br>from Russia and the world`, sub: `Russia and ${nCountries} countries, up to 320 kbps. Keeps playing in the background while Chrome is open.` },
      { title: `Countries<br>with flags`, sub: `Search in English or Russian: USA, UK, Germany, China and more.` },
      { title: `Its own genres<br>in every country`, sub: `Country, hip-hop, old-school, rock, jazz: the most popular stations of each country.` },
      { title: `Song titles<br>and a sound analyzer`, sub: `See what is playing right now. Click the title to search the song on Google.` },
      { title: `Everything at hand`, sub: `Smooth transitions, data saver, sync, keyboard shortcuts and backup.` },
    ],
    tile: `Radio from Russia and the world`,
    newTitle: `What's new in 1.5`,
    news: [`${nStations}+ stations: Russia and ${nCountries} countries`, 'Countries tab with flags, bilingual search', 'Russian and English interface', 'Genres, filters and song titles right in the list', 'Smooth transitions between stations', 'Sync, backup and settings', 'Improved stream stability'],
  },
};

function chromeExe() {
  const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
  for (const d of fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const e = path.join(base, d, 'chrome-win64/chrome.exe'); if (fs.existsSync(e)) return e;
  }
  throw new Error('нет Chromium');
}

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-test-prof-'));
const ctx = await chromium.launchPersistentContext(prof, {
  executablePath: chromeExe(), headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'],
});
const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
const id = sw.url().split('/')[2];
const page = await ctx.newPage();
const state = () => page.evaluate(() => chrome.runtime.sendMessage({ type: 'get-state' }));
const favs = ['nashe', 'europaplus', 'record', 'retro', 'mayak', 'ultra'].filter((i) => STATIONS.some((s) => s.id === i));

async function prepare(lang, theme) {
  await page.goto(`chrome-extension://${id}/popup.html`);
  await page.evaluate(([l, t, f]) => chrome.storage.local.set({ lang: l, theme: t, favs: f, view: 'tiles', settings: { saver: false, buffer: 4, fade: false, resume: false, sync: false } }), [lang, theme, favs]);
  await page.evaluate(() => chrome.runtime.sendMessage({ type: 'stop' }));
  await sw.evaluate(() => chrome.offscreen.closeDocument().catch(() => {}));
  await page.reload(); await page.waitForSelector('#list .row, #list .crow'); await sleep(900);
}
async function playAndWait(stationId, kbps) {
  await page.evaluate(([i, k]) => chrome.runtime.sendMessage({ type: 'play', id: i, kbps: k }), [stationId, kbps]);
  for (let n = 0; n < 45; n++) { await sleep(1000); const s = await state(); if (s.status === 'playing' && s.track && s.viz) break; }
  await sleep(2500);
}
const snap = async (file) => { await sleep(600); await page.screenshot({ path: file, omitBackground: true }); };

// Сами снимки окна: [тема, подготовка]
const bestCountry = () => (COUNTRIES.find((c) => c.cc === 'US') && STATIONS.some((s) => s.country === 'US') ? 'US' : COUNTRIES.find((c) => STATIONS.some((s) => s.country === c.cc))?.cc);
const plans = [
  ['dark', async () => { await playAndWait('nashe', 256); }],
  ['light', async () => { await page.click('.tabs [data-tab=countries]'); await sleep(900); }],
  ['dark', async () => { await page.click('.tabs [data-tab=countries]'); await sleep(500); await page.click('#vtoggle [data-view=list]'); await sleep(300); await page.click(`.crow[data-cc=${bestCountry()}]`); await sleep(1200); }],
  ['light', async () => { await playAndWait('europaplus', 320); await page.click('#vtoggle [data-view=list]').catch(() => {}); }],
  ['dark', async () => { await page.click('#gear'); await sleep(900); }],
];

for (const lang of ['ru', 'en']) {
  const dir = path.join(out, lang); fs.mkdirSync(dir, { recursive: true });
  const raws = [];
  for (let i = 0; i < plans.length; i++) {
    await prepare(lang, plans[i][0]);
    await plans[i][1]();
    const f = path.join(dir, `popup${i + 1}.png`); await snap(f); raws.push(f);
    console.log(lang, 'окно', i + 1);
  }
  await page.evaluate(() => chrome.runtime.sendMessage({ type: 'stop' }));
  const comp = await ctx.newPage(); await comp.setViewportSize({ width: 1280, height: 800 });
  for (let i = 0; i < raws.length; i++) {
    const dark = plans[i][0] === 'dark', s = T[lang].shots[i];
    const img = 'data:image/png;base64,' + fs.readFileSync(raws[i]).toString('base64');
    await comp.setContent(`<!doctype html><meta charset=utf-8><style>
      *{box-sizing:border-box;margin:0}
      body{width:1280px;height:800px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:${dark ? '#f4f1ff' : '#241a3a'};
        background:${dark ? 'radial-gradient(900px 600px at 15% 10%,#3a1d6b 0%,transparent 60%),radial-gradient(800px 600px at 95% 95%,#7a1f57 0%,transparent 60%),#120d1f' : 'radial-gradient(900px 600px at 15% 10%,#ffd9e6 0%,transparent 60%),radial-gradient(800px 600px at 95% 95%,#d9ccff 0%,transparent 60%),#fbf7ff'};
        display:flex;align-items:center;justify-content:center;gap:80px}
      div.w{filter:drop-shadow(0 30px 50px rgba(0,0,0,${dark ? .55 : .25}))} img{height:720px;display:block;clip-path:inset(7.2px round 28.8px)}
      h1{font-size:46px;line-height:1.12;font-weight:700;letter-spacing:-.02em}
      p{margin-top:22px;font-size:24px;line-height:1.45;max-width:460px;opacity:.72}
      b{display:block;font-size:20px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:22px;color:${dark ? '#ff7a99' : '#e0386a'}}
    </style><div class=w><img src="${img}"></div><div><b>${T[lang].brand}</b><h1>${s.title}</h1><p>${s.sub}</p></div>`);
    await sleep(400);
    await comp.screenshot({ path: path.join(dir, `store-${i + 1}.png`) });
  }
  // малая плитка 440×280
  const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'icons/idle128.png')).toString('base64');
  const tile = await ctx.newPage(); await tile.setViewportSize({ width: 440, height: 280 });
  await tile.setContent(`<!doctype html><meta charset=utf-8><style>*{margin:0;box-sizing:border-box}
    body{width:440px;height:280px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#f4f1ff;
    background:radial-gradient(300px 220px at 10% 0%,#4a2390 0%,transparent 65%),radial-gradient(300px 240px at 100% 100%,#9a2468 0%,transparent 65%),#120d1f;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center}
    img{width:96px;height:96px;border-radius:24px;filter:drop-shadow(0 12px 22px rgba(0,0,0,.5))}h1{font-size:38px;font-weight:700;letter-spacing:-.01em}p{font-size:17px;opacity:.78}
    </style><img src="${icon}"><h1>Velvet Radio</h1><p>${T[lang].tile}</p>`);
  await sleep(300); await tile.screenshot({ path: path.join(dir, 'small-promo-440x280.png') });
  // картинка «Что нового»
  const wn = await ctx.newPage(); await wn.setViewportSize({ width: 1280, height: 800 });
  await wn.setContent(`<!doctype html><meta charset=utf-8><style>*{margin:0;box-sizing:border-box}
    body{width:1280px;height:800px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#f4f1ff;
    background:radial-gradient(900px 600px at 10% 5%,#3a1d6b 0%,transparent 60%),radial-gradient(800px 600px at 95% 100%,#7a1f57 0%,transparent 60%),#120d1f;
    display:flex;flex-direction:column;justify-content:center;padding:0 140px}
    b{font-size:22px;letter-spacing:.16em;text-transform:uppercase;color:#ff7a99;margin-bottom:18px}h1{font-size:72px;font-weight:700;letter-spacing:-.02em;margin-bottom:44px}
    ul{list-style:none;display:grid;gap:18px}li{font-size:32px;display:flex;align-items:center;gap:20px}
    li::before{content:'';width:14px;height:14px;border-radius:50%;flex:none;background:linear-gradient(145deg,#ff5e78,#ff9f43);box-shadow:0 0 18px #ff5e7899}
    </style><b>Velvet Radio</b><h1>${T[lang].newTitle}</h1><ul>${T[lang].news.map((n) => `<li>${n}</li>`).join('')}</ul>`);
  await sleep(300); await wn.screenshot({ path: path.join(dir, 'whats-new-1.5.png') });
  await comp.close(); await tile.close(); await wn.close();
}
await ctx.close().catch(() => {});
fs.rmSync(prof, { recursive: true, force: true });
console.log('готово:', out);
process.exit(0);
