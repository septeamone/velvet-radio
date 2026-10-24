// Готовит всё для страницы расширения в Chrome Web Store: скриншоты 1280×800 для русской и английской версий,
// малую (440×280) и большую (1400×560) рекламные плитки и иконку магазина 128×128, в папку store-upload/.
//   node tools/store-pack.mjs [--skip-capture]
// Окно расширения снимается настоящим (скрытый Chromium без звука, играет реальная станция); дальше кадры вставляются в оформленный макет.
// --skip-capture: не снимать окно заново, собрать макеты из уже снятых кадров (папка raw в временном каталоге).
// Формат на выходе: PNG без прозрачности (24 бита), как требует кабинет разработчика.
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'store-upload');
const work = path.join(os.tmpdir(), 'velvet-store-pack'); const raw = path.join(work, 'raw');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const skip = process.argv.includes('--skip-capture');
fs.mkdirSync(raw, { recursive: true });

const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);

/* ---------------- 1. снимки настоящего окна ---------------- */
const BAD = /(fuck|shit|pussy|bitch|sex|nigg|whore|dick|cock|porn|slut|\bass\b|секс|бля|хуй|хуе|пизд|ебан|ебат|сука|порн)/i;   // в рекламных кадрах не должно быть грубых названий песен
const FAVS = ['europaplus', 'record', 'retro'];

async function capture(lang) {
  const dir = path.join(raw, lang); fs.mkdirSync(dir, { recursive: true });
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-test-prof-')), { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
    args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
  try {
    const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker'); const id = sw.url().split('/')[2];
    const page = await ctx.newPage();
    const open = async (theme) => { await page.evaluate((a) => chrome.storage.local.set(a), { tour: { v: 1, done: true }, lang, theme, view: 'list', favs: FAVS, settings: {} }); await page.reload(); await page.waitForSelector('.row .kb'); await sleep(1800); };
    const quietSearch = async () => { await page.evaluate(() => { const q = document.querySelector('#q'); q.focus(); q.blur(); }); await page.waitForFunction(() => !document.querySelector('#q').placeholder.includes('|'), null, { timeout: 5000 }).catch(() => {}); await sleep(300); };
    // «тихий» кадр: в рекламе надпись без эха-призраков, а поле поиска с обычной подсказкой (класс no-anim останавливает печать и эхо)
    const shot = async (name) => {
      await page.mouse.move(470, 8);
      await page.addStyleTag({ content: '.rb-echo-ghost,.rb-echo-bursts{display:none!important}' }).catch(() => {});
      await page.evaluate(() => document.documentElement.classList.add('no-anim')); await quietSearch(); await sleep(900);
      await page.screenshot({ path: path.join(dir, name + '.png'), omitBackground: true, clip: { x: 0, y: 0, width: 480, height: 600 } });
      await page.evaluate(() => document.documentElement.classList.remove('no-anim')); console.log(lang, 'снимок', name);
    };
    const clean = () => page.evaluate((re) => [...document.querySelectorAll('#list .row .trk, #nowSub, #nowTitle')].map((e) => e.textContent).filter((t) => new RegExp(re, 'i').test(t)), BAD.source);
    await page.goto(`chrome-extension://${id}/popup.html`); await page.waitForSelector('.row');
    await open('dark');
    // играет Europa Plus; ждём настоящий звук и названия песен
    for (let attempt = 0; attempt < 5; attempt++) {
      await page.click('.row:nth-child(1)');
      await page.waitForFunction(() => document.querySelector('.player.on') && !document.querySelector('.player.loading'), null, { timeout: 60000 });
      await sleep(5000);
      const bad = await clean();
      if (!bad.length) break;
      console.log(lang, 'грубое название, пробуем другую станцию:', bad.join(' | '));
      await page.click(`.row:nth-child(${2 + attempt})`); await sleep(1500);
    }
    await shot('hero');
    // страны: плитки, курсор над флагом (виден возвращающийся цвет)
    await page.click('.tabs [data-tab=countries]'); await sleep(500);
    await page.click('#vtoggle [data-view=tiles]'); await sleep(1500);
    await page.mouse.move(330, 262); await sleep(800);
    await page.addStyleTag({ content: '.rb-echo-ghost,.rb-echo-bursts{display:none!important}' }).catch(() => {});
    await page.evaluate(() => document.documentElement.classList.add('no-anim')); await quietSearch(); await sleep(900);
    await page.mouse.move(330, 262); await sleep(400);
    await page.screenshot({ path: path.join(dir, 'countries.png'), omitBackground: true, clip: { x: 0, y: 0, width: 480, height: 600 } });
    await page.evaluate(() => document.documentElement.classList.remove('no-anim')); console.log(lang, 'снимок countries');
    // жанры
    await page.click('.tabs [data-tab=all]'); await sleep(600);
    await page.click('#gbtn'); await sleep(1100); await shot('genres'); await page.click('#gbtn'); await sleep(500);
    // избранное: шесть станций с сердечками
    await page.evaluate((f) => chrome.storage.local.set({ favs: f }), ['europaplus', 'record', 'retro', 'radio7', 'dorognoe', 'vestifm']); await page.reload(); await page.waitForSelector('.row .kb'); await sleep(1800);
    await page.click('.tabs [data-tab=fav]'); await sleep(1800); await shot('favorites');
    await page.evaluate((f) => chrome.storage.local.set({ favs: f }), FAVS);
    // тёмная и светлая тема с играющей станцией
    await page.reload(); await page.waitForSelector('.row .kb'); await sleep(1800); await shot('now-dark');
    await open('light'); await sleep(1500); await shot('now-light');
    await page.evaluate(() => chrome.runtime.sendMessage({ type: 'stop' })).catch(() => {});
  } finally { await ctx.close(); }
}

/* ---------------- 2. макеты ---------------- */
const T = {
  ru: {
    slides: [
      { h: 'Радио со всего мира', p: 'Больше 400 станций России и 28 стран. Звук до 320 kbps.' },
      { h: 'Страны с флагами', p: 'Список или плитки. Поиск на русском и английском.' },
      { h: 'Жанры каждой страны', p: 'Рок, джаз, хип-хоп, ретро: самые популярные станции по жанрам.' },
      { h: 'Избранное под рукой', p: 'Свой список станций, перетаскивание и горячие клавиши.' },
      { h: 'Две темы. Один стиль.', p: 'Графит и слоновая кость.' },
    ],
  },
  en: {
    slides: [
      { h: 'Radio from around the world', p: '400+ stations from Russia and 28 countries. Up to 320 kbps.' },
      { h: 'Every country, with flags', p: 'A list or tiles. Search in English or Russian.' },
      { h: 'Genres for every country', p: 'Rock, jazz, hip-hop, retro: the most popular stations by genre.' },
      { h: 'Favorites at hand', p: 'Your own list of stations, drag to reorder, keyboard shortcuts.' },
      { h: 'Two themes. One style.', p: 'Graphite and ivory.' },
    ],
  },
};
const font = (f) => pathToFileURL(path.join(root, 'vendor/fonts', f)).href;
const img = (p) => pathToFileURL(p).href;
const css = `
@font-face{font-family:'Geist V';font-weight:100 900;src:url('${font('geist-latin-wght-normal.woff2')}') format('woff2-variations');unicode-range:U+0000-00FF,U+2000-206F,U+2212;}
@font-face{font-family:'Geist V';font-weight:100 900;src:url('${font('geist-cyrillic-wght-normal.woff2')}') format('woff2-variations');unicode-range:U+0400-045F,U+2116;}
*{box-sizing:border-box;margin:0}
html,body{width:100%;height:100%;overflow:hidden;background:#0f1012;font-family:'Geist V',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:100%;height:100%;overflow:hidden;
  background:radial-gradient(1200px 720px at 10% -12%,rgba(205,176,122,.085),transparent 62%),radial-gradient(900px 600px at 105% 112%,rgba(255,255,255,.035),transparent 62%),linear-gradient(180deg,#131417,#0e0f11)}
.stage::before{content:'';position:absolute;inset:0;opacity:.07;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.frame{position:absolute;inset:26px;border:1px solid rgba(255,255,255,.055);border-radius:22px;pointer-events:none}
.label{display:flex;align-items:center;gap:14px;font-size:13px;font-weight:560;letter-spacing:.36em;text-transform:uppercase;color:#cdb07a}
.label::before{content:'';width:38px;height:1px;background:#cdb07a;opacity:.7}
h1{font-size:56px;line-height:1.04;font-weight:600;letter-spacing:-.035em;color:#f2f1ed;margin-top:26px}
p.sub{font-size:21px;line-height:1.5;font-weight:420;color:#9b9da4;margin-top:22px;letter-spacing:-.005em}
.win{position:absolute;filter:drop-shadow(0 34px 60px rgba(0,0,0,.62)) drop-shadow(0 0 0 rgba(255,255,255,.04))}
.win img{display:block;height:auto}
.copy{position:absolute}
`;
const page = (body, w, h) => `<!doctype html><meta charset="utf-8"><style>${css}</style><body><div class="stage" style="width:${w}px;height:${h}px"><div class="frame"></div>${body}</div></body>`;
// Снимок окна 480×600 (в нём поля по 6 px и тёмный холст вокруг скруглённого тела 468×588 с радиусом 18): показываем только тело, с тем же скруглением.
const bodyW = (h) => Math.round(h * 468 / 588);
const win = (file, h, x, y, extra = '') => { const bw = bodyW(h), k = bw / 468; return `<div class="win" style="left:${x}px;top:${y}px;width:${bw}px;height:${h}px;${extra}"><div style="width:100%;height:100%;border-radius:${18 * k}px;overflow:hidden"><img style="width:${480 * k}px;max-width:none;margin:${-6 * k}px 0 0 ${-6 * k}px" src="${img(file)}"></div></div>`; };
const textBlock = (label, h, p, x, y, w) => `<div class="copy" style="left:${x}px;top:${y}px;width:${w}px"><div class="label">${label}</div><h1>${h}</h1><p class="sub">${p}</p></div>`;

function slide(lang, i) {
  const s = T[lang].slides[i], d = (n) => path.join(raw, lang, n + '.png'), L = 'Velvet Radio';
  const W = 1280, H = 800;
  if (i === 4) {      // две темы: окна выходят за нижний край, заголовок по центру
    const wh = 700, ww = bodyW(wh);
    const body = `<div class="copy" style="left:0;right:0;top:92px;text-align:center"><div class="label" style="justify-content:center">${L}</div><h1 style="font-size:52px;margin-top:22px">${s.h}</h1><p class="sub" style="margin-top:14px">${s.p}</p></div>`
      + win(d('now-dark'), wh, W / 2 - ww - 14, 282) + win(d('now-light'), wh, W / 2 + 14, 282);
    return page(body, W, H);
  }
  const files = ['hero', 'countries', 'genres', 'favorites'][i], right = i % 2 === 0, wh = 668, ww = bodyW(wh);
  const wx = right ? W - ww - 118 : 118, tx = right ? 118 : wx + ww + 96;
  return page(textBlock(L, s.h, s.p, tx, 250, right ? wx - tx - 56 : W - tx - 100) + win(d(files), wh, wx, (H - wh) / 2), W, H);
}
function promoSmall() {
  const W = 440, H = 280, d = path.join(raw, 'en', 'hero.png');
  return page(`<div class="copy" style="left:34px;top:82px"><img src="${img(path.join(root, 'icons/idle128.png'))}" style="width:68px;height:68px;display:block;border-radius:17px;box-shadow:0 14px 28px rgba(0,0,0,.5)"><div style="margin-top:24px;font-size:15px;letter-spacing:.3em;text-transform:uppercase;color:#f2f1ed;font-weight:600;white-space:nowrap">Velvet Radio</div><div style="width:34px;height:1px;background:#cdb07a;opacity:.8;margin-top:14px"></div></div>`
    + win(d, 300, 236, 44), W, H).replace('.frame{', '.frame{display:none;');
}
function promoMarquee() {
  const W = 1400, H = 560, d = (n) => path.join(raw, 'en', n + '.png');
  return page(`<div class="copy" style="left:118px;top:168px"><img src="${img(path.join(root, 'icons/idle128.png'))}" style="width:92px;height:92px;display:block;border-radius:23px;box-shadow:0 18px 40px rgba(0,0,0,.55)"><div style="margin-top:38px;font-size:44px;letter-spacing:.3em;text-transform:uppercase;color:#f2f1ed;font-weight:600;white-space:nowrap">Velvet Radio</div><div style="width:56px;height:1px;background:#cdb07a;opacity:.85;margin-top:26px"></div></div>`
    + win(d('now-light'), 520, 940, 92) + win(d('hero'), 580, 748, 70), W, H);
}
const iconStore = () => `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent"><img src="${img(path.join(root, 'icons/idle128.png'))}" style="position:absolute;left:16px;top:16px;width:96px;height:96px"></body>`;   // по правилам магазина: рисунок 96×96 с прозрачным полем 16 px

/* ---------------- 3. сборка ---------------- */
async function render(browser, html, w, h, file, transparent = false) {
  const tmp = path.join(work, 'page.html'); fs.writeFileSync(tmp, html);
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(tmp).href); await p.evaluate(() => document.fonts.ready); await sleep(500);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await p.screenshot({ path: file, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } }); await p.close();
}

if (!skip) { await capture('ru'); await capture('en'); }
const browser = await chromium.launch({ executablePath: exe, headless: false, args: ['--headless=new', '--disable-audio-output', '--allow-file-access-from-files'] });
try {
  const names = ['01-stations', '02-countries', '03-genres', '04-favorites', '05-themes'];
  for (const lang of ['ru', 'en']) {
    const dir = path.join(out, lang === 'ru' ? '3-русский (по умолчанию)' : '4-английский', lang === 'ru' ? 'скриншоты' : 'screenshots');
    for (let i = 0; i < 5; i++) await render(browser, slide(lang, i), 1280, 800, path.join(dir, `${names[i]}-${lang}.png`));
  }
  await render(browser, promoSmall(), 440, 280, path.join(out, '2-для обоих языков', 'малая-плитка-440x280.png'));
  await render(browser, promoMarquee(), 1400, 560, path.join(out, '2-для обоих языков', 'большая-плитка-1400x560.png'));
  await render(browser, iconStore(), 128, 128, path.join(out, '1-иконка', 'иконка-магазина-128x128.png'), true);
} finally { await browser.close(); }

/* ---------------- 4. формат: PNG без прозрачности (кроме иконки), проверка размеров ---------------- */
const py = `
import sys, glob, os
from PIL import Image
base = sys.argv[1]; bad = 0
sizes = {'малая': (440, 280), 'большая': (1400, 560), 'иконка': (128, 128)}
for f in sorted(glob.glob(os.path.join(base, '**', '*.png'), recursive=True)):
    im = Image.open(f); name = os.path.basename(f)
    want = (1280, 800)
    for k, v in sizes.items():
        if name.startswith(k): want = v
    if name.startswith('иконка'):
        im = im.convert('RGBA'); mode = 'RGBA (иконка, прозрачные поля)'
    else:
        im = im.convert('RGB'); mode = 'RGB 24 бита, без прозрачности'
    im.save(f, optimize=True)
    ok = im.size == want
    bad += (not ok)
    print(('OK  ' if ok else 'FAIL'), name, im.size, mode, round(os.path.getsize(f) / 1024), 'КБ')
sys.exit(1 if bad else 0)
`;
fs.writeFileSync(path.join(work, 'check.py'), py);
execFileSync('python', ['-I', path.join(work, 'check.py'), out], { stdio: 'inherit' });
