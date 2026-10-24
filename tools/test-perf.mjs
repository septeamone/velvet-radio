// Замер плавности окна: FPS во время смены темы и прокрутки списка (скрыто, без звука).
//   node tools/test-perf.mjs [<папка расширения>]     по умолчанию корень репозитория
// Печатает среднее FPS, число кадров дольше 50 мс и худший кадр. Для сравнения «до/после» запускайте на двух папках в одинаковых условиях.
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ext = path.resolve(process.argv[2] ?? root);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-test-prof-'));
const ctx = await chromium.launchPersistentContext(prof, { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--no-first-run'] });
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${sw.url().split('/')[2]}/popup.html`);
  await page.evaluate(() => chrome.storage.local.set({ tour: { v: 1, done: true } })); await page.reload();   // свежий профиль показывает тур для новых пользователей, в замере его быть не должно
  await page.waitForSelector('#list .row'); await sleep(1500);

  const measure = (ms) => page.evaluate((ms) => new Promise((resolve) => {
    const t = []; let last = performance.now(); const t0 = last;
    const tick = (now) => { t.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(tick); else resolve(t); };
    requestAnimationFrame(tick);
  }), ms);
  const stats = (t) => { const s = t.slice(1); const sum = s.reduce((a, b) => a + b, 0); return { fps: +(s.length / (sum / 1000)).toFixed(1), slow: s.filter((x) => x > 50).length, worst: Math.round(Math.max(...s)) }; };

  // смена темы: 4 раза подряд; во время неё идёт запись кадров
  const themes = [];
  for (let i = 0; i < 4; i++) {
    const rec = measure(1200);
    await sleep(60); await page.click('#theme');
    themes.push(stats(await rec)); await sleep(400);
  }
  console.log('смена темы   ', themes.map((s) => `${s.fps} fps (медленных ${s.slow}, худший ${s.worst} мс)`).join(' | '));

  // прокрутка списка колесом
  const rec = measure(1500);
  for (let i = 0; i < 12; i++) { await page.mouse.move(240, 300); await page.mouse.wheel(0, 260); await sleep(100); }
  const sc = stats(await rec);
  console.log('прокрутка    ', `${sc.fps} fps (медленных ${sc.slow}, худший ${sc.worst} мс)`);
  const rows = await page.evaluate(() => document.querySelectorAll('#list .row').length);
  console.log('плашек в списке', rows);
} finally { await ctx.close().catch(() => {}); fs.rmSync(prof, { recursive: true, force: true }); }
process.exit(0);
