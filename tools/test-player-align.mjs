// Выравнивание плеера: левый край значка громкости = левый край логотипа, правый край процентов = правый край кнопки паузы,
// одинаковые отступы плеера слева, справа и сверху. Измеряется в настоящем окне (скрыто, без звука).
//   node tools/test-player-align.mjs [<папка-для-png>]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null; if (out) fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-align-')), { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
let fails = 0;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) fails++; };
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${sw.url().split('/')[2]}/popup.html`); await page.waitForSelector('.row');
  await page.evaluate(() => chrome.storage.local.set({ tour: { v: 1, done: true }, lang: 'ru', theme: 'dark', last: 'europaplus' })); await page.reload(); await page.waitForSelector('.row'); await sleep(1500);
  for (const viz of [true, false]) {
    await page.evaluate((v) => chrome.storage.local.set({ settings: { showViz: v } }), viz); await page.reload(); await page.waitForSelector('.row'); await sleep(1500);
    const m = await page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
      // видимый левый край значка громкости: его контур начинается не в левом углу SVG (viewBox 24, контур с x = 4)
      const ic = document.querySelector('.rb-elastic-host svg, .vol svg'); const q = ic.getBoundingClientRect();
      const path = ic.querySelector('path'); const bb = path.getBBox(); const vb = ic.viewBox.baseVal;
      const glyphLeft = q.left + (bb.x - vb.x) / vb.width * q.width;
      const viz = document.querySelector('#viz'), vizOn = viz && getComputedStyle(viz).display !== 'none' && viz.getBoundingClientRect().height > 1;
      const gl = (svg) => { const b = svg.getBoundingClientRect(), bb = svg.getBBox(), v = svg.viewBox.baseVal, k = b.width / v.width; return { l: b.left + (bb.x - v.x) * k, r: b.left + (bb.x + bb.width - v.x) * k }; };
      const tr = document.querySelector('.rb-elastic-track').getBoundingClientRect(), gq = gl(document.querySelector('.rb-elastic-quiet')), gd = gl(document.querySelector('.rb-elastic-loud'));
      return { gapL: tr.left - gq.r, gapR: gd.l - tr.right, iconB: q.bottom, player: r('.player'), logo: r('#nowLogo'), play: r('.play'), num: r('.rb-num'), vol: r('.vol'), glyphLeft, viz: r('#viz'), vizOn };
    });
    const L = m.logo.l - m.player.l, R = m.player.r - m.play.r, T = m.play.t - m.player.t, B = m.player.b - (m.vizOn ? (m.viz.t + m.viz.b) / 2 : m.iconB);
    console.log(`визуализатор ${viz ? 'включён' : 'выключен'}: отступы плеера слева ${L.toFixed(1)}, справа ${R.toFixed(1)}, сверху ${T.toFixed(1)}, снизу до последнего элемента ${B.toFixed(1)}`);
    check(Math.abs(L - R) <= 1, 'отступ слева равен отступу справа');
    check(Math.abs(L - T) <= 1.5, 'отступ сверху равен боковым');
    check(Math.abs(L - B) <= 3, 'снизу до видимого края (значок громкости или линия волны) тот же отступ (±3)');
    check(Math.abs(m.glyphLeft - m.logo.l) <= 1, `значок громкости начинается на линии логотипа (${(m.glyphLeft - m.logo.l).toFixed(1)} px)`);
    check(Math.abs(m.gapL - m.gapR) <= 0.7, `зазоры между ползунком и значками громкости равны: слева ${m.gapL.toFixed(1)}, справа ${m.gapR.toFixed(1)} px`);
    check(Math.abs(m.num.r - m.play.r) <= 1.5, `правый край процентов на линии кнопки паузы (${(m.num.r - m.play.r).toFixed(1)} px)`);
    if (out) { await sleep(500); await page.screenshot({ path: path.join(out, `player-${viz ? 'viz' : 'noviz'}.png`), clip: { x: 0, y: 440, width: 480, height: 160 } }); }
  }
} finally { await ctx.close(); }
console.log(fails ? `ПРОВАЛОВ: ${fails}` : 'всё хорошо');
process.exit(fails ? 1 : 0);
