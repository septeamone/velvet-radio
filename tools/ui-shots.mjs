// Скрытые скриншоты окна расширения (без звука и видимых окон) + проверка ошибок в консоли.
//   node tools/ui-shots.mjs <папка-для-png> [--ext <папка расширения>]
// Делает снимки: список «Россия» (светлая/тёмная), «Избранное», «Страны» (список и плитки), страна внутри, поиск на двух языках, английский интерфейс.
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? 'ui-shots');
const extArg = process.argv.indexOf('--ext');
const ext = path.resolve(extArg > 0 ? process.argv[extArg + 1] : root);
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--no-first-run'],
});
const errors = [];
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const id = sw.url().split('/')[2];
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(`chrome-extension://${id}/popup.html`);
  await page.waitForSelector('.row');
  await page.evaluate(() => chrome.storage.local.set({ lang: 'ru', view: 'list', theme: 'light' }));
  await page.reload(); await page.waitForSelector('.row'); await sleep(900);
  const shot = async (name) => { await sleep(500); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('снимок', name); };
  const rows = () => page.evaluate(() => document.querySelectorAll('#list .row, #list .crow').length);

  await shot('01-russia-light');
  await page.click('#theme'); await shot('02-russia-dark');
  await page.click('.tabs [data-tab=fav]'); await shot('03-fav-empty');
  await page.click('.tabs [data-tab=all]');
  await page.click('.row:nth-child(2) .heart'); await page.click('.tabs [data-tab=fav]'); await shot('04-fav');
  await page.click('.tabs [data-tab=countries]'); await shot('05-countries-list');
  await page.click('#vtoggle [data-view=tiles]'); await shot('06-countries-tiles');
  console.log('стран в списке:', await rows());
  await page.fill('#q', 'герм'); await sleep(200); console.log('поиск «герм» →', await rows());
  await page.fill('#q', 'united'); await sleep(200); console.log('поиск «united» →', await rows()); await shot('07-search-united');
  await page.fill('#q', ''); await sleep(200);
  await page.click('#list .crow'); await shot('08-country-open');
  await page.click('#cback');
  await page.click('#lang'); await shot('09-countries-en-tiles');
  await page.click('#vtoggle [data-view=list]');
  await page.click('.tabs [data-tab=all]'); await shot('10-russia-en');
  await page.click('#gbtn'); await shot('11-genre-panel');
  await page.click('#gpanel .chip:nth-child(3)'); await shot('12-genre-filtered'); await page.click('#gbtn'); await page.click('#gpanel .chip:first-child');
  await page.click('#gear'); await shot('13-settings');
  await page.click('#setback');
  await page.keyboard.press('/'); await page.keyboard.type('retro'); await page.keyboard.press('ArrowDown'); await shot('14-keyboard-search');
  console.log('после поиска «retro» строк:', await rows(), '; выбрана с клавиатуры:', await page.evaluate(() => document.querySelector('.kbd')?.dataset.id));
  const info = await page.evaluate(() => ({ w: document.documentElement.clientWidth, h: document.documentElement.clientHeight, lang: document.documentElement.lang,
    listH: document.querySelector('#list').getBoundingClientRect().height, rowH: document.querySelector('.row')?.getBoundingClientRect().height,
    horizScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
  console.log('размеры:', JSON.stringify(info));
} finally {
  await ctx.close().catch(() => {});
  fs.rmSync(prof, { recursive: true, force: true });
}
console.log(errors.length ? 'ОШИБКИ В КОНСОЛИ:\n' + [...new Set(errors)].join('\n') : 'ошибок в консоли нет');
process.exit(errors.length ? 1 : 0);
