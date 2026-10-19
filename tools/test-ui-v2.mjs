// Скрытая проверка нового вида (без звука и видимых окон): надпись при открытии, подсказка, играющая станция, жанры, светлая тема,
// переключение на классический вид и обратно, ошибки консоли и сетевые ошибки. Снимки кладёт в указанную папку.
//   node tools/test-ui-v2.mjs <папка-для-png> [--ext <папка расширения>]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? 'ui-v2-shots'); fs.mkdirSync(out, { recursive: true });
const ei = process.argv.indexOf('--ext'); const ext = path.resolve(ei > 0 ? process.argv[ei + 1] : root);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-test-prof-')), { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--no-first-run'] });
const errs = []; let failed = false;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) failed = true; };
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const id = sw.url().split('/')[2]; const page = await ctx.newPage();
  page.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  const shot = async (n, w = 500) => { await sleep(w); await page.screenshot({ path: path.join(out, n + '.png') }); console.log('снимок', n); };
  const state = () => page.evaluate(() => document.documentElement.dataset.ui + '/' + document.documentElement.dataset.theme + (document.documentElement.classList.contains('rb-ready') ? '/ready' : ''));
  await page.goto(`chrome-extension://${id}/popup.html`); await page.waitForSelector('.row');
  await page.evaluate(() => chrome.storage.local.set({ lang: 'ru', theme: 'dark', view: 'list', settings: {} }));
  await page.reload(); await page.waitForSelector('.row');
  await page.screenshot({ path: path.join(out, 'echo-0.png'), clip: { x: 0, y: 0, width: 480, height: 80 } });
  await sleep(300); await page.screenshot({ path: path.join(out, 'echo-1.png'), clip: { x: 0, y: 0, width: 480, height: 80 } });
  await sleep(1800);
  check((await state()) === 'new/dark/ready', 'новый вид по умолчанию, эффекты подключились: ' + await state());
  check(await page.evaluate(() => !!document.querySelector('.rb-elastic-wrap') && !!document.querySelector('.dot.rb-sm') && !!document.querySelector('.rb-echo-root')), 'громкость, индикатор и надпись заменены');
  await page.hover('.row:nth-child(2) .seg button'); await shot('tooltip', 900);
  check(await page.evaluate(() => !!document.querySelector('#rb-wt-tip.on, #rb-wt-tip[data-open], #rb-wt-tip')), 'подсказка создана');
  await page.mouse.move(240, 560);
  await page.click('.row:nth-child(1)'); await shot('dark-loading', 700);
  await page.waitForFunction(() => document.querySelector('.player.on') && !document.querySelector('.player.loading'), null, { timeout: 40000 }).catch(() => {});
  await shot('dark-playing', 600);
  check(await page.evaluate(() => document.querySelector('.dot')?.dataset.st === 'ok'), 'станция играет, индикатор «ок»');
  await page.hover('.row:nth-child(3)'); await shot('dark-hover', 400);
  await page.click('#gbtn'); await shot('dark-genres', 700); await page.click('#gbtn'); await sleep(500);
  await page.click('#theme'); await shot('light-playing', 800);
  await page.click('#gear'); await sleep(400); await shot('light-settings', 300);
  await page.click('input[data-set=classic]'); await sleep(1500);
  check((await state()).startsWith('classic/light'), 'переключено на классический вид: ' + await state());
  check(await page.evaluate(() => !document.querySelector('.rb-elastic-wrap')), 'в классическом виде элементы нового не подключены');
  await shot('classic', 300);
  await page.click('#gear'); await sleep(400); await page.click('input[data-set=classic]'); await sleep(1800);
  check((await state()).startsWith('new/light'), 'вернулись на новый вид: ' + await state());
  await page.evaluate(() => chrome.runtime.sendMessage({ type: 'stop' })).catch(() => {});
} finally {
  console.log(errs.length ? 'ОШИБКИ:\n' + errs.join('\n') : 'ошибок консоли и сети нет'); await ctx.close();
  process.exitCode = failed || errs.length ? 1 : 0;
}
