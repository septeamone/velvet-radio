// Проверка доработок интерфейса: качество в плеере, заглушение, возврат к играющей станции, зоны нажатия, контраст текста (WCAG AA) в обеих темах.
// Скрыто и без звука. Станцию запускаем, но выход звука отключён (--disable-audio-output); в конце останавливаем.
//   node tools/test-ux.mjs [<папка-для-png>]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null; if (out) fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'vr-ux-')), { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
const errors = []; let fails = 0;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) fails++; };
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const url = `chrome-extension://${sw.url().split('/')[2]}/popup.html`;
  const open = async (data) => { await page.goto(url); await page.waitForSelector('.row'); await page.evaluate((d) => chrome.storage.local.set(d), { tour: { v: 1, done: true }, lang: 'ru', theme: 'dark', ...data }); await page.reload(); await page.waitForSelector('.row'); await sleep(1400); };
  const shot = async (n) => { if (out) { await sleep(600); await page.screenshot({ path: path.join(out, n + '.png') }); } };

  await open({ last: 'europaplus', settings: {} });
  // --- список: вместо трёх кнопок качества в каждой строке спокойная подпись
  const rows = await page.$$eval('#list .row', (r) => ({ n: r.length, seg: r.filter((x) => x.querySelector('.seg')).length, kb: r.filter((x) => /^\d+$/.test(x.querySelector('.kb')?.textContent ?? '')).length }));
  check(rows.seg === 0 && rows.kb === rows.n, `в строках нет переключателей качества, у всех ${rows.kb} из ${rows.n} подпись с битрейтом`);
  // --- качество в плеере
  check(await page.isVisible('#qbtn') && (await page.textContent('#qval')) === '320', 'кнопка качества в плеере показывает 320 у Europa Plus');
  check(await page.$eval('#qbtn', (b) => b.getBoundingClientRect().height) >= 32, 'кнопка качества не ниже 32 px');
  await page.click('#qbtn'); await sleep(900);
  const items = await page.$$eval('#qMenu .hrow', (r) => r.map((x) => x.textContent.trim()));
  check(items.length === 3 && items[0].startsWith('320'), 'меню качества: ' + items.join(' | '));
  const geo = await page.evaluate(() => { const m = document.querySelector('#qWrap').getBoundingClientRect(), b = document.querySelector('#qbtn').getBoundingClientRect(); return { aboveBtn: m.bottom <= b.top + 1, inside: m.left >= 0 && m.right <= innerWidth && m.top >= 0 }; });
  check(geo.aboveBtn && geo.inside, 'меню качества открывается над кнопкой и целиком в окне');
  await shot('q-menu');
  await page.click('#qMenu .hrow:nth-child(2)'); await sleep(700);
  check((await page.textContent('#qval')) === '192' && (await page.textContent('.row[data-id=europaplus] .kb')) === '192', 'выбор 192: кнопка и подпись в строке обновились');
  check((await page.evaluate(async () => (await chrome.storage.local.get('quality')).quality?.europaplus)) === 192, 'выбранное качество сохранено');
  // станция с одним качеством: кнопка есть, но неактивна
  await page.evaluate(() => chrome.storage.local.set({ last: 'dacha' })); await page.reload(); await page.waitForSelector('.row'); await sleep(1200);
  check(await page.$eval('#qbtn', (b) => b.classList.contains('one')) && (await page.$eval('#qbtn', (b) => getComputedStyle(b.querySelector('svg')).display)) === 'none', 'у станции с одним качеством стрелки нет');
  await page.click('#qbtn', { force: true }); await sleep(400);
  check(!(await page.isVisible('#qWrap')), 'и список не открывается');

  // --- заглушить
  await page.evaluate(() => chrome.storage.local.set({ last: 'europaplus' })); await page.reload(); await page.waitForSelector('.row'); await sleep(1200);
  const v0 = +(await page.inputValue('#vol'));
  await page.click('.vol > svg'); await sleep(500);
  check(+(await page.inputValue('#vol')) === 0 && (await page.textContent('.rb-num')).trim().startsWith('0'), 'клик по значку динамика выключает звук (0%)');
  check((await page.getAttribute('.vol > svg', 'aria-label')) === 'Включить звук', 'подпись значка сменилась на «Включить звук»');
  await page.click('.vol > svg'); await sleep(500);
  check(Math.abs(+(await page.inputValue('#vol')) - v0) < 0.011, 'второй клик возвращает прежнюю громкость');
  await page.keyboard.press('m'); await sleep(300); const muted = +(await page.inputValue('#vol')) === 0;
  await page.keyboard.press('m'); await sleep(300);
  check(muted && Math.abs(+(await page.inputValue('#vol')) - v0) < 0.011, 'клавиша M включает и выключает звук');

  // --- возврат к играющей станции
  await page.evaluate(() => document.querySelector('.row[data-id=studio21]').scrollIntoView({ block: 'center' })); await sleep(900);
  await page.click('.row[data-id=studio21]'); await sleep(1500);
  await page.evaluate(() => { document.querySelector('#list').scrollTop = 0; }); await sleep(900);
  check(await page.isVisible('#locate') && (await page.getAttribute('#locate', 'data-dir')) === '1', 'когда играющая ниже экрана, появляется «К играющей» со стрелкой вниз');
  await shot('locate');
  await page.click('#locate'); await sleep(1500);
  const vis = await page.evaluate(() => { const r = document.querySelector('.row[data-id=studio21]').getBoundingClientRect(), l = document.querySelector('#list').getBoundingClientRect(), p = document.querySelector('.player').getBoundingClientRect(); return r.top >= l.top - 2 && r.bottom <= Math.min(l.bottom, p.top) + 2; });
  check(vis && !(await page.isVisible('#locate')), 'клик по кнопке прокручивает к станции, кнопка исчезает');
  await page.evaluate(() => { document.querySelector('#list').scrollTop = 99999; }); await sleep(900);
  check(await page.isVisible('#locate') && (await page.getAttribute('#locate', 'data-dir')) === '-1', 'если проскроллить ниже станции, стрелка вверх');
  await page.click('.tabs [data-tab=fav]'); await sleep(500);
  await page.click('#nowTitle'); await sleep(1500);
  check((await page.$eval('.tabs button.on', (b) => b.dataset.tab)) === 'all' && await page.isVisible('.row[data-id=studio21]'), 'клик по названию в плеере возвращает на нужную вкладку к играющей станции');
  await page.click('#toggle'); await sleep(600);          // остановить

  // --- шапка, размеры, контраст
  const head = await page.evaluate(() => ({ langSvg: !!document.querySelector('#lang svg'), langTxt: document.querySelector('#langLabel').textContent, langTitle: document.querySelector('#lang').title || document.querySelector('#lang').dataset.wt, tgTitle: document.querySelector('#tg').title || document.querySelector('#tg').dataset.wt }));
  check(head.langSvg && head.langTxt === 'RU' && /English/.test(head.langTitle), `кнопка языка: глобус + RU, подсказка «${head.langTitle}»`);
  check(/браузер/.test(head.tgTitle), `у ссылки на Telegram подсказка предупреждает о внешней ссылке: «${head.tgTitle}»`);
  const sizes = await page.evaluate(() => { const h = (s) => { const e = document.querySelector(s); return [e.offsetWidth, e.offsetHeight]; }; return { gear: h('#gear'), theme: h('#theme'), heart: h('.row .heart'), tabs: h('.tabs button'), play: h('.play') }; });
  // размеры без учёта временного масштаба при наведении (offsetWidth)
  check(sizes.gear[0] >= 32 && sizes.gear[1] >= 32 && sizes.theme[1] >= 32 && sizes.heart[0] >= 32 && sizes.heart[1] >= 32 && sizes.tabs[1] >= 28, `зоны нажатия: шапка ${sizes.gear}, сердечко ${sizes.heart}, вкладка ${sizes.tabs}`);
  for (const theme of ['dark', 'light']) {
    await page.evaluate((t) => chrome.storage.local.set({ theme: t }), theme); await page.reload(); await page.waitForSelector('.row'); await sleep(1400);
    const r = await page.evaluate(() => {
      const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor, p = c.match(/[\d.]+/g); if (p && (p[3] === undefined || +p[3] > 0)) stack.push(c); } let b = { r: 255, g: 255, b: 255 }; for (const c of stack.reverse()) { const p = parse(c); b = { r: p.r * p.a + b.r * (1 - p.a), g: p.g * p.a + b.g * (1 - p.a), b: p.b * p.a + b.b * (1 - p.a) }; } return b; };
      const ratio = (el) => { const fg = parse(getComputedStyle(el).color), bg = bgOf(el); const f = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }; const a = lum(f), b = lum(bg); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); };
      const sel = { 'подпись песни': '.row .meta', 'битрейт в строке': '.row .kb', 'неактивная вкладка': '.tabs button:not(.on)', 'подпись плеера': '#nowSub', 'проценты громкости': '.rb-num', 'kbps на кнопке': '#qbtn small' };
      return Object.fromEntries(Object.entries(sel).map(([k, s]) => [k, document.querySelector(s) ? ratio(document.querySelector(s)) : null]));
    });
    const bad = Object.entries(r).filter(([, v]) => v !== null && v < 4.5);
    check(!bad.length, `контраст текста в теме «${theme}» ≥ 4,5: ` + Object.entries(r).map(([k, v]) => `${k} ${v}`).join(', '));
  }
  check(errors.length === 0, 'ошибок в консоли нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
} finally { await ctx.close(); }
console.log(fails ? `ПРОВАЛОВ: ${fails}` : 'всё хорошо');
process.exit(fails ? 1 : 0);
