// Настройки: структура (разделы и карточки), единая вертикальная линия значков и заголовков, навигация по разделам, сохранение,
// сброс с подтверждением, горячие клавиши, зоны нажатия, контраст, тексты на обоих языках. Скрыто и без звука.
//   node tools/test-settings.mjs [<папка-для-png>]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null; if (out) fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-set-')), { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
const errors = []; let fails = 0;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) fails++; };
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const url = `chrome-extension://${sw.url().split('/')[2]}/popup.html`;
  const open = async (data) => { await page.goto(url); await page.waitForSelector('.row'); await page.evaluate((d) => chrome.storage.local.set(d), { tour: { v: 1, done: true }, lang: 'ru', theme: 'dark', favs: ['europaplus'], ...data }); await page.reload(); await page.waitForSelector('.row'); await sleep(1300); await page.click('#gear'); await sleep(800); };
  const stored = () => page.evaluate(async () => (await chrome.storage.local.get('settings')).settings);
  const shot = async (n) => { if (out) { await sleep(500); await page.screenshot({ path: path.join(out, n + '.png') }); } };

  await open({});
  // --- структура
  const st = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.setgroup')], rows = [...document.querySelectorAll('.set')];
    const x = (e) => Math.round(e.getBoundingClientRect().left * 10) / 10;
    return { groups: groups.length, secs: document.querySelectorAll('.setsec').length, rows: rows.length, noIcon: rows.filter((r) => !r.querySelector('.sico')).length,
      iconX: [...new Set(rows.map((r) => x(r.querySelector('.sico'))))], titleX: [...new Set(rows.map((r) => x(r.querySelector('.st b'))))],
      overflow: document.querySelector('.setbody').scrollWidth > document.querySelector('.setbody').clientWidth + 1,
      minRowH: Math.min(...rows.map((r) => r.getBoundingClientRect().height)), pills: [...document.querySelectorAll('.set .pill')].map((p) => p.offsetHeight) };
  });
  check(st.groups === 5 && st.secs === 5, `настройки разбиты на ${st.groups} группы с заголовками`);
  check(st.noIcon === 0 && st.iconX.length === 1, `у всех ${st.rows} строк есть значок, все значки на одной вертикали (x=${st.iconX})`);
  check(st.titleX.length === 1, `все заголовки строк на одной вертикали (x=${st.titleX}), раньше «Проверка станций» была сдвинута`);
  check(!st.overflow, 'нет горизонтальной прокрутки');
  check(st.minRowH >= 56 && Math.min(...st.pills) >= 32, `высота строк не меньше ${Math.round(st.minRowH)} px, кнопки не ниже ${Math.min(...st.pills)} px`);
  check(!!(await page.$('#checkIco .rb-cm')), 'в строке «Проверка станций» значок-состояние стоит на месте обычного значка');
  await shot('1-top');

  // --- навигация по разделам
  const secTop = (id) => page.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top - document.querySelector('.setbody').getBoundingClientRect().top), id);
  await page.click('#setnav [data-go=secData]'); await sleep(1100);
  const t = await secTop('secData');
  check(t >= 0 && t <= 26, `клик «Данные» прокручивает к разделу (отступ ${t} px)`);
  check((await page.$eval('#setnav button.on', (b) => b.dataset.go)) === 'secData', 'вкладка «Данные» подсвечена');
  await page.evaluate(() => { document.querySelector('.setbody').scrollTop = 0; }); await sleep(500);
  check((await page.$eval('#setnav button.on', (b) => b.dataset.go)) === 'secMain', 'при прокрутке вверх подсвечено «Основное»');
  await page.evaluate(() => { document.querySelector('.setbody').scrollTop = 99999; }); await sleep(600);
  check((await page.$eval('#setnav button.on', (b) => b.dataset.go)) === 'secMore', 'внизу списка подсвечено «Ещё»');
  check(await page.$eval('.sethead', (e) => e.classList.contains('scrolled')), 'под шапкой появляется тонкая линия, когда содержимое прокручено');
  await shot('2-bottom');

  // --- горячие клавиши
  const keys = await page.$$eval('#keyList .keyline', (r) => r.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  const keyBox = await page.evaluate(() => { const g = document.querySelector('.set.keys').getBoundingClientRect(); return [...document.querySelectorAll('#keyList .keyline')].every((l) => l.getBoundingClientRect().right <= g.right + 1 && l.getBoundingClientRect().height < 30); });
  check(keys.length === 3 && keyBox, 'горячие клавиши: три строки, помещаются в карточку: ' + keys.join(' | '));

  // --- сохранение, понятные подписи надёжности потока
  await page.evaluate(() => { document.querySelector('.setbody').scrollTop = 0; }); await sleep(400);
  await page.click('[data-set=resume]', { force: true }); await sleep(500);
  check((await stored()).resume === true, 'переключатель «Запускать с Chrome» сохраняется');
  const labels = await page.$$eval('#bufseg button', (b) => b.map((x) => x.textContent.trim()));
  check(labels.join() === 'Быстро,Баланс,Надёжно', 'надёжность потока: ' + labels.join(' / '));
  await page.click('#bufseg button[data-k="14"]'); await sleep(400);
  check((await stored()).buffer === 14, '«Надёжно» сохраняет запас 14 секунд');

  // --- сброс с подтверждением
  await page.evaluate(() => { document.querySelector('.setbody').scrollTop = 99999; }); await sleep(400);
  await page.click('#breset'); await sleep(300);
  check((await page.textContent('#breset')).trim() === 'Точно?' && (await stored()).resume === true, 'первый клик по «Сбросить» только просит подтвердить');
  await page.waitForTimeout(4400);
  check((await page.textContent('#breset')).trim() === 'Сбросить', 'без второго клика кнопка сама возвращается');
  await page.click('#breset'); await sleep(200); await page.click('#breset'); await sleep(1500);
  await page.waitForSelector('.row'); await sleep(900);
  const afterReset = await stored();
  check(afterReset.resume === false && afterReset.buffer === 9, 'второй клик сбросил настройки к умолчанию');
  check(await page.evaluate(async () => (await chrome.storage.local.get('favs')).favs?.[0] === 'europaplus'), 'избранное при сбросе настроек не тронуто');

  // --- тексты и контраст в обеих темах и языках
  for (const [lang, theme] of [['ru', 'dark'], ['ru', 'light'], ['en', 'dark'], ['en', 'light']]) {
    await open({ lang, theme });
    const r = await page.evaluate(() => {
      const bad = [...document.querySelectorAll('#settings [data-t]')].filter((e) => !e.textContent.trim() || /^(s|sec|nav|k)[A-Z]/.test(e.textContent.trim())).map((e) => e.dataset.t);
      const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor, p = c.match(/[\d.]+/g); if (p && (p[3] === undefined || +p[3] > 0)) stack.push(c); } let b = { r: 255, g: 255, b: 255 }; for (const c of stack.reverse()) { const p = parse(c); b = { r: p.r * p.a + b.r * (1 - p.a), g: p.g * p.a + b.g * (1 - p.a), b: p.b * p.a + b.b * (1 - p.a) }; } return b; };
      const ratio = (el) => { const fg = parse(getComputedStyle(el).color), bg = bgOf(el); const f = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }; const a = lum(f), b = lum(bg); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); };
      return { bad, desc: ratio(document.querySelector('.set .st small')), sec: ratio(document.querySelector('.setsec')), nav: ratio(document.querySelector('#setnav button:not(.on)')), title: ratio(document.querySelector('.set .st b')) };
    });
    check(!r.bad.length, `${lang}: у всех подписей есть текст${r.bad.length ? ', пустые: ' + r.bad.join(',') : ''}`);
    check(Math.min(r.desc, r.sec, r.nav) >= 4.5, `${lang}/${theme}: контраст описаний ${r.desc}, заголовков разделов ${r.sec}, вкладок ${r.nav} (нужно ≥ 4,5)`);
    if (lang === 'ru') await shot(`3-${theme}`);
  }
  check(errors.length === 0, 'ошибок в консоли нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
} finally { await ctx.close(); }
console.log(fails ? `ПРОВАЛОВ: ${fails}` : 'всё хорошо');
process.exit(fails ? 1 : 0);
