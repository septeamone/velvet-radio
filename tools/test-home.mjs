// Проверка «главной страны» (первая вкладка): выбор через «Сделать главной» и через настройки, список стран, поиск, сохранение.
//   node tools/test-home.mjs <папка-для-png>
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? 'home-shots'); fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-home-')), { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
const errors = []; let fails = 0;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) fails++; };
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const id = sw.url().split('/')[2];
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`chrome-extension://${id}/popup.html`); await page.waitForSelector('.row');
  await page.evaluate(() => chrome.storage.local.set({ tour: { v: 1, done: true }, lang: 'ru', theme: 'dark' })); await page.reload(); await page.waitForSelector('.row'); await sleep(800);
  const tab1 = () => page.textContent('.tabs [data-tab=all]');
  const rowCountries = () => page.evaluate(() => [...document.querySelectorAll('#list .row')].map((r) => r.dataset.id));
  const crow = () => page.evaluate(() => [...document.querySelectorAll('#list .crow .cn')].map((e) => e.textContent));
  const shot = async (n) => { await sleep(500); await page.screenshot({ path: path.join(out, n + '.png') }); };

  check((await tab1()).trim() === 'Россия', 'по умолчанию первая вкладка «Россия»');
  await page.click('.tabs [data-tab=countries]'); await sleep(300);
  let cs = await crow(); check(!cs.includes('Россия') && cs.includes('США'), 'во вкладке «Страны» России нет, США есть');
  // 1. через карточку страны
  await page.fill('#q', 'сша'); await sleep(200); await page.click('#list .crow'); await sleep(400);
  await shot('1-country-card');
  check(await page.isVisible('#chome') && (await page.textContent('#chome')).includes('главной'), 'в карточке США кнопка «Сделать главной»');
  await page.click('#chome'); await sleep(600);
  check((await tab1()).trim() === 'США', 'первая вкладка стала «США»');
  check((await rowCountries()).every((i) => i.startsWith('us-')) && (await rowCountries()).length > 20, 'на первой вкладке станции США');
  await shot('2-us-home');
  await page.click('.tabs [data-tab=countries]'); await sleep(300);
  cs = await crow(); check(cs.includes('Россия') && !cs.includes('США'), 'теперь «Россия» в списке стран, США нет');
  await page.fill('#q', 'russia'); await sleep(200); check((await crow()).includes('Россия'), 'поиск «russia» находит Россию');
  await page.fill('#q', ''); await page.click('#list .crow >> nth=0'); await sleep(300);
  // станции России видны внутри карточки + поиск станции из избранного/поиска показывает страну
  await shot('3-russia-card');
  // 2. сохраняется между открытиями
  await page.reload(); await page.waitForSelector('.row'); await sleep(700);
  check((await tab1()).trim() === 'США', 'после перезагрузки окна главная страна сохранилась');
  // 3. через настройки
  await page.click('#gear'); await sleep(300);
  check((await page.textContent('#homeName')).trim() === 'США', 'в настройках выбрано США');
  // выпадающий список: свой, без системной рамки
  await page.click('#homeBtn'); await sleep(900);
  check(await page.isVisible('#homeMenu') && (await page.$$('#homeMenu .hrow')).length >= 29, 'список стран открылся: ' + (await page.$$('#homeMenu .hrow')).length + ' строк');
  check(await page.$eval('#homeMenu .hrow.cur', (e) => e.dataset.cc) === 'US', 'текущая страна отмечена');
  const al = await page.$$eval('#homeMenu .hrow', (r) => r.filter((x) => x.dataset.al).length);
  check(al > 0, 'эффект прокрутки: строки за краем списка спрятаны (' + al + ')');
  await shot('6-menu');
  await page.$eval('#homeMenu', (m) => { m.scrollTop = 0; }); await sleep(900);
  const first = await page.$eval('#homeMenu .hrow', (e) => e.dataset.al ?? 'in');
  check(first === 'in', 'после прокрутки вверх первая строка снова на месте');
  await page.keyboard.press('Escape'); await sleep(400);
  check(!(await page.isVisible('#homeMenu')) && await page.isVisible('#settings'), 'Esc закрывает только список, настройки остались');
  await page.focus('#homeBtn'); await page.keyboard.press('ArrowDown'); await sleep(700);
  check(await page.isVisible('#homeMenu'), 'стрелка вниз открывает список с клавиатуры');
  await page.keyboard.press('Home'); await page.keyboard.press('Enter'); await sleep(900);
  const picked = (await page.textContent('#homeName')).trim();
  check(!(await page.isVisible('#homeMenu')) && picked !== 'США', 'Enter выбрал первую страну списка: ' + picked);
  await page.click('#homeBtn'); await sleep(800); await page.click('#homeMenu .hrow[data-cc=GB]'); await sleep(700);
  check((await page.textContent('#homeName')).trim() === 'Великобритания', 'клик по строке выбирает страну');
  await page.click('#setback'); await sleep(300);
  check((await tab1()).trim().length > 3 && (await rowCountries()).length >= 20 && (await rowCountries()).some((i) => i.startsWith('gb-')), 'через настройки главной стала Великобритания: ' + (await tab1()).trim());
  await page.click('#lang'); await sleep(400); check(/UK|United Kingdom/.test(await tab1()), 'язык EN меняет подпись вкладки: ' + (await tab1()).trim());
  await shot('4-gb-en');
  // 4. вернуть Россию
  await page.click('#lang'); await page.click('#gear'); await sleep(300); await page.click('#homeBtn'); await sleep(800); await page.click('#homeMenu .hrow[data-cc=RU]'); await sleep(600); await page.click('#setback');
  check((await tab1()).trim() === 'Россия', 'вернули Россию');
  await page.click('#gear'); await sleep(300); await shot('5-settings');
  check(errors.length === 0, 'ошибок в консоли нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
} finally { await ctx.close(); }
console.log(fails ? `ПРОВАЛОВ: ${fails}` : 'всё хорошо');
process.exit(fails ? 1 : 0);
