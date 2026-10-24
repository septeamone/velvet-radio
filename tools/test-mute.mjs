// Громкость 0 = настоящая тишина, но воспроизведение не обрывается: Chrome закрывает аудио-документ, если 35+ секунд нет слышимого звука,
// поэтому на нуле движок держит неслышный сигнал (offscreen.js, syncKeepAlive). Тест держит 0% дольше 40 секунд и проверяет, что станция играет.
// Скрыто, выход звука отключён.   node tools/test-mute.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
// Без --mute-audio: при нём Chrome считает звук неслышимым и сам закрывает документ (см. ADDING-STATIONS.md, шаг 9)
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-mute-')), { executablePath: exe, headless: false, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
let fails = 0;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) fails++; };
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${sw.url().split('/')[2]}/popup.html`); await page.waitForSelector('.row');
  await page.evaluate(() => chrome.storage.local.set({ tour: { v: 1, done: true }, lang: 'ru' })); await page.reload(); await page.waitForSelector('.row'); await sleep(1200);
  const state = () => page.evaluate(() => chrome.runtime.sendMessage({ type: 'get-state' }));
  const docs = () => page.evaluate(async () => (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length);
  const setVol = (v) => page.evaluate((x) => { const i = document.querySelector('#vol'); i.value = x; i.dispatchEvent(new Event('input', { bubbles: true })); }, v);

  await page.click('.row[data-id=europaplus]');
  for (let i = 0; i < 40 && (await state()).status !== 'playing'; i++) await sleep(1000);
  check((await state()).status === 'playing', 'станция играет');
  await setVol(0); await sleep(1500);
  check((await page.textContent('.rb-num')).trim().startsWith('0'), 'громкость 0%');
  for (let t = 10; t <= 45; t += 5) {
    await sleep(5000);
    if ((await state()).status !== 'playing' || !(await docs())) break;
  }
  const st = await state();
  check(st.status === 'playing' && (await docs()) === 1, `после 45 секунд на 0% станция играет, аудио-документ жив (status ${st.status})`);
  await setVol(0.8); await sleep(2500);
  const st2 = await state();
  check(st2.status === 'playing' && Math.abs(st2.volume - 0.8) < 0.011, 'звук можно вернуть без перезапуска станции, громкость ' + st2.volume);
  await page.click('#toggle'); await sleep(800);
} finally { await ctx.close(); }
console.log(fails ? `ПРОВАЛОВ: ${fails}` : 'всё хорошо');
process.exit(fails ? 1 : 0);
