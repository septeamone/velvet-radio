// Проверка интерактивного тура: шаги, подсветка, карточка, кнопки, сохранение прогресса, повтор из настроек, клавиатура. Скрыто и без звука.
//   node tools/test-tour.mjs <папка-для-png>
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? path.join(os.tmpdir(), 'vr-tour-shots')); fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-tour-')), { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 }, locale: 'en-US',
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
const errors = []; let fails = 0;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) fails++; };
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const id = sw.url().split('/')[2];
  const url = `chrome-extension://${id}/popup.html`;
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });   // ответы сторонних серверов песен (429 и т.п.) не наша ошибка
  const open = async () => { await page.goto(url); await page.waitForSelector('.row'); await sleep(900); };
  const shot = async (n) => { await sleep(750); await page.screenshot({ path: path.join(out, n + '.png') }); };
  const stored = () => page.evaluate(async () => (await chrome.storage.local.get('tour')).tour);
  const count = () => page.textContent('.tour-count').then((s) => s.trim());
  const tab1 = () => page.textContent('.tabs [data-tab=all]').then((s) => s.trim());
  const geometry = () => page.evaluate(() => {
    const r = (e) => { const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
    const hole = document.querySelector('.tour-hole'), card = document.querySelector('.tour-card'), body = document.body.getBoundingClientRect();
    return { hole: r(hole), card: r(card), body: { l: body.left, t: body.top, r: body.right, b: body.bottom } };
  });

  // чистая установка: при onInstalled сервис-воркер ставит tour; в тесте создаём то же состояние вручную
  await open();
  await page.evaluate(() => chrome.storage.local.set({ tour: { v: 1, step: 0, done: false }, lang: 'ru', theme: 'dark', settings: { home: 'RU' } }));
  await open();
  await page.waitForSelector('.tour.open', { timeout: 8000 });
  check((await count()) === '1 из 8', 'тур стартует на шаге «1 из 8»: ' + await count());
  const chips = await page.$$eval('.tour-chip', (c) => c.map((x) => x.dataset.cc));
  check(chips.length >= 29 && chips[0] === 'US', 'в выборе страны ' + chips.length + ' стран, первая рекомендованная по языку браузера: ' + chips[0]);
  check((await tab1()) === 'США', 'рекомендованная страна сразу стала первой вкладкой: ' + await tab1());
  check((await page.$eval('.tour-chip.on', (e) => e.dataset.cc)) === 'US', 'в сетке выбрана США');
  await shot('01-welcome');
  await page.click('.tour-chip[data-cc=DE]'); await sleep(500);
  check((await tab1()) === 'Германия', 'клик по Германии меняет первую вкладку: ' + await tab1());
  check((await stored()).picked === true, 'выбор страны записан в прогресс');
  check((await page.$eval('.tour-back', (b) => getComputedStyle(b).visibility)) === 'hidden', 'на первом шаге нет кнопки «Назад»');

  const labels = ['welcome', 'tabs', 'search', 'row', 'quality', 'heart', 'player', 'settings'];
  const targets = { 1: ['.tabs'], 2: ['.searchrow'], 3: ['#list .row'], 4: ['.player'], 5: ['#list .row .heart'], 6: ['.player'], 7: ['#gear'] };
  for (let s = 1; s < 8; s++) {
    await page.click('.tour-next'); await sleep(1000);
    check((await count()) === `${s + 1} из 8`, `шаг ${s + 1}: счётчик «${await count()}»`);
    const g = await geometry();
    const inside = g.card.l >= g.body.l - 1 && g.card.r <= g.body.r + 1 && g.card.t >= g.body.t - 1 && g.card.b <= g.body.b + 1;
    check(inside, `шаг ${s + 1}: карточка внутри окна`);
    const tg = await page.evaluate((sels) => sels.map((q) => { const e = document.querySelector(q); const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }), targets[s]);
    const covers = tg.every((r) => g.hole.l <= r.l + 1 && g.hole.t <= r.t + 1 && g.hole.r >= r.r - 1 && g.hole.b >= r.b - 1);
    check(covers, `шаг ${s + 1} (${labels[s]}): подсветка накрывает элемент`);
    const overlap = !(g.card.r < g.hole.l || g.card.l > g.hole.r || g.card.b < g.hole.t || g.card.t > g.hole.b);
    check(!overlap, `шаг ${s + 1}: карточка не закрывает подсвеченный элемент`);
    await shot(`0${s + 1}-${labels[s]}`);
    if (s === 3) { // «Назад» и снова «Далее»
      await page.click('.tour-back'); await sleep(800); check((await count()) === '3 из 8', 'кнопка «Назад» возвращает на шаг 3');
      await page.click('.tour-next'); await sleep(800);
    }
    if (s === 4) { // закрыли окно на середине: прогресс сохранён
      check((await stored()).step === 4, 'прогресс записан: шаг 4');
      await open(); await page.waitForSelector('.tour.open'); await sleep(800);
      check((await count()) === '5 из 8', 'после закрытия и открытия окна тур продолжается с шага 5');
    }
  }
  check((await page.textContent('.tour-next')).trim() === 'Готово', 'на последнем шаге кнопка «Готово»');
  check((await page.$eval('.tour-skip', (b) => getComputedStyle(b).visibility)) === 'hidden', 'на последнем шаге «Пропустить» скрыто');
  await page.click('.tour-next'); await sleep(700);
  check(!(await page.$('.tour')), 'после «Готово» тур закрыт');
  const fin = await stored(); check(fin.done === true && fin.skipped === false, 'прогресс: тур пройден');
  check((await tab1()) === 'Германия', 'выбранная страна осталась первой вкладкой');
  await open(); await sleep(800); check(!(await page.$('.tour')), 'после перезагрузки тур не появляется');

  // повтор из настроек: выбранную страну не трогает
  await page.click('#gear'); await sleep(400); await page.click('#btour'); await page.waitForSelector('.tour.open'); await sleep(800);
  check((await count()) === '1 из 8' && (await tab1()) === 'Германия', 'повтор из настроек стартует с шага 1, страна не сбросилась');
  // клавиатура
  await page.focus('.tour-next');
  await page.keyboard.press('ArrowRight'); await sleep(900); check((await count()) === '2 из 8', 'стрелка → переходит дальше');
  await page.keyboard.press('ArrowLeft'); await sleep(900); check((await count()) === '1 из 8', 'стрелка ← возвращает');
  await page.keyboard.press('/'); await sleep(200); check(await page.evaluate(() => document.activeElement?.id !== 'q'), 'горячие клавиши окна во время тура не срабатывают');
  await page.keyboard.press('Escape'); await sleep(700);
  check(!(await page.$('.tour')) && (await stored()).skipped === true, 'Esc пропускает тур и сохраняет это');
  // «Skip» мышью + светлая тема + английский
  await page.evaluate(() => chrome.storage.local.set({ tour: { v: 1, step: 2, done: false }, lang: 'en', theme: 'light' })); await open();
  await page.waitForSelector('.tour.open'); check((await count()) === '3 of 8', 'английский интерфейс, продолжение с шага 3: ' + await count());
  await shot('10-light-en-search');
  await page.click('.tour-skip'); await sleep(700);
  check(!(await page.$('.tour')) && (await stored()).done === true, 'кнопка «Skip» закрывает тур');
  // классический вид: тур берёт цвета из его переменных
  await page.evaluate(() => chrome.storage.local.set({ tour: { v: 1, step: 3, done: false }, lang: 'ru', theme: 'light', settings: { classic: true, home: 'DE' } })); await open();
  await page.waitForSelector('.tour.open'); check((await count()) === '4 из 8', 'классический вид: тур работает, шаг ' + await count());
  await shot('11-classic'); await page.click('.tour-skip'); await sleep(500);
  await page.evaluate(() => chrome.storage.local.set({ settings: { classic: false, home: 'DE' } }));
  check(errors.length === 0, 'ошибок в консоли нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
} finally { await ctx.close(); }
console.log(fails ? `ПРОВАЛОВ: ${fails}` : 'всё хорошо');
process.exit(fails ? 1 : 0);
