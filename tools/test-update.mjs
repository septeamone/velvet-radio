// Что увидит пользователь, который просто обновился. Берём последний опубликованный пакет (store-upload/0-пакет) как «старого пользователя»,
// создаём его данные, подменяем файлы свежей сборкой (python tools/build.py → dist/build) в том же профиле Chrome и открываем окно.
// Решение «что записать при обновлении» берём из настоящего lifecycle.js с теми же данными, что присылает Chrome (reason: 'update', previousVersion).
// (Событие onInstalled от самого Chrome в безоконном браузере воспроизвести нельзя: перезагрузка расширения там его отключает.
//  Его проверяют вручную: распаковать 1.6.0, подменить файлы новыми, нажать «Обновить» в chrome://extensions, см. инструкцию.)
//   node tools/test-update.mjs [<папка-для-png>]
import { chromium } from 'playwright-core';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ? path.resolve(process.argv[2]) : null; if (out) fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
// Последний опубликованный пакет: самый новый velvet-radio-X.Y.Z.zip в store-upload/0-пакет с версией ниже текущей (после выпуска кладём туда пакет выпущенной версии)
const cmpV = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0); return 0; };
function previousPackage(current) {
  const dir = path.join(root, 'store-upload', '0-пакет');
  const found = fs.readdirSync(dir).map((f) => [f, /^velvet-radio-(\d+\.\d+\.\d+)\.zip$/.exec(f)?.[1]]).filter(([, v]) => v && cmpV(v, current) < 0).sort((a, b) => cmpV(b[1], a[1]))[0];
  if (!found) throw new Error('В store-upload/0-пакет нет пакета предыдущей версии (нужен velvet-radio-X.Y.Z.zip ниже ' + current + ')');
  return { zip: path.join(dir, found[0]), version: found[1] };
}

let fails = 0;
const check = (ok, msg) => { console.log(ok ? 'OK  ' : 'FAIL', msg); if (!ok) fails++; };

// 1. свежая сборка (заодно проверяет, что в пакет попали все нужные файлы)
const b = spawnSync('python', [path.join(root, 'tools/build.py')], { cwd: root, encoding: 'utf8' });
check(b.status === 0, 'сборка пакета (tools/build.py) проходит: ' + (b.stdout.trim().split('\n').pop() || b.stderr.slice(0, 200)));
const build = path.join(root, 'dist/build');
const newVersion = JSON.parse(fs.readFileSync(path.join(build, 'manifest.json'), 'utf8')).version;
const WHATS_NEW_FOR_OK = () => new RegExp(`WHATS_NEW_FOR\\s*=\\s*'${newVersion.replace(/\./g, '\\.')}'`).test(fs.readFileSync(path.join(root, 'lifecycle.js'), 'utf8'));

// 2. решение при установке/обновлении (настоящий lifecycle.js из сборки)
const { installedPatch } = await import(pathToFileURL(path.join(build, 'lifecycle.js')).href);
check(WHATS_NEW_FOR_OK(), 'карточки «Что нового» подготовлены именно для версии ' + newVersion + ' (lifecycle.js: WHATS_NEW_FOR)');
{ // для каждого шага есть заголовок и текст на обоих языках
  const tour = fs.readFileSync(path.join(root, 'ui/tour.js'), 'utf8'), i18n = fs.readFileSync(path.join(root, 'i18n.js'), 'utf8');
  const block = tour.slice(tour.indexOf('export const WHATS_NEW_STEPS'), tour.indexOf('];', tour.indexOf('export const WHATS_NEW_STEPS')));
  const ids = [...block.matchAll(/id: '(\w+)'/g)].map((m) => m[1]);
  const half = i18n.indexOf('  en: {');
  const missing = [];
  for (const id of ids) for (const k of [`wn_${id}_t`, `wn_${id}_d`]) for (const [lang, text] of [['ru', i18n.slice(0, half)], ['en', i18n.slice(half)]]) if (!new RegExp(`\\b${k}: '[^']{3,}'`).test(text)) missing.push(`${lang}:${k}`);
  for (const [lang, text] of [['ru', i18n.slice(0, half)], ['en', i18n.slice(half)]]) if (!/\bwnDone: '[^']+'/.test(text)) missing.push(`${lang}:wnDone`);
  check(ids.length >= 3 && !missing.length, `у ${ids.length} карточек «Что нового» есть тексты на русском и английском${missing.length ? ', нет: ' + missing.join(', ') : ''}`);
}
const upd = installedPatch({ reason: 'update', previousVersion: previousPackage(newVersion).version }, newVersion);
check(upd?.whatsNew?.v === newVersion && upd.whatsNew.from === previousPackage(newVersion).version && upd.whatsNew.done === false && !upd.tour, 'обновление ' + previousPackage(newVersion).version + ' → ' + newVersion + ': записывается только «Что нового»');
check(installedPatch({ reason: 'install' }, newVersion)?.tour?.done === false && !installedPatch({ reason: 'install' }, newVersion).whatsNew, 'новая установка: записывается полный тур, а не «Что нового»');
check(installedPatch({ reason: 'update', previousVersion: newVersion }, newVersion) === null, 'перезагрузка той же версии ничего не показывает');
check(installedPatch({ reason: 'chrome_update' }, newVersion) === null && installedPatch({ reason: 'shared_module_update' }, newVersion) === null, 'обновление самого Chrome ничего не показывает');

// 3. старый пакет, как его получил пользователь из магазина
const { zip, version: prevVersion } = previousPackage(newVersion);
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-upd-'));
const extDir = path.join(work, 'ext'), profile = path.join(work, 'profile');
execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${extDir}' -Force`]);
const oldVersion = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8')).version;

const launch = (dir, prof) => chromium.launchPersistentContext(prof, { executablePath: exe, headless: false, deviceScaleFactor: 2, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${dir}`, `--load-extension=${dir}`, '--no-first-run'] });
async function popup(ctx) {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${sw.url().split('/')[2]}/popup.html`); await page.waitForSelector('.row'); await sleep(1200);
  return page;
}
const get = (page, keys) => page.evaluate((k) => chrome.storage.local.get(k), keys);
const shot = async (page, n) => { if (out) { await sleep(700); await page.screenshot({ path: path.join(out, n + '.png') }); } };

try {
  // 4. пользователь работает со старой версией
  let ctx = await launch(extDir, profile);
  let page = await popup(ctx);
  check((await page.evaluate(() => chrome.runtime.getManifest().version)) === oldVersion, `установлена старая версия ${oldVersion}`);
  await page.evaluate(() => chrome.storage.local.set({ favs: ['europaplus', 'record', 'nashe'], order: ['nashe', 'europaplus'], theme: 'light', lang: 'ru', quality: { europaplus: 192 }, last: 'record', volume: 0.55 }));
  const before = await get(page, ['tour', 'whatsNew']);
  check(before.tour === undefined && before.whatsNew === undefined, 'у старой версии нет ни тура, ни «Что нового»');
  await shot(page, '0-old-version');
  await ctx.close();

  // 5. вышло обновление: файлы заменены, Chrome сообщает расширению об обновлении (данные те же, что пришлёт Chrome)
  for (const f of fs.readdirSync(extDir)) fs.rmSync(path.join(extDir, f), { recursive: true, force: true });
  fs.cpSync(build, extDir, { recursive: true });
  ctx = await launch(extDir, profile);
  page = await popup(ctx);
  check((await page.evaluate(() => chrome.runtime.getManifest().version)) === newVersion, `после обновления версия ${newVersion}`);
  await page.evaluate((p) => chrome.storage.local.set(p), upd);
  await page.reload(); await page.waitForSelector('.row');
  const st = await get(page, ['tour', 'whatsNew', 'favs', 'theme', 'quality', 'order', 'last', 'volume']);
  check(st.tour === undefined, 'полный тур обновившемуся не назначен');
  check(JSON.stringify(st.favs) === '["europaplus","record","nashe"]' && st.theme === 'light' && st.quality.europaplus === 192 && st.last === 'record' && st.volume === 0.55, 'данные старого пользователя (избранное, тема, качество, последняя станция, громкость) целы');

  await page.waitForSelector('.tour.open', { timeout: 8000 });
  const count = () => page.textContent('.tour-count').then((s) => s.trim());
  const title = () => page.textContent('.tour-title').then((s) => s.trim());
  check((await count()) === '1 из 6' && /обновился/.test(await title()), `открывается «Что нового»: «${await title()}» (${await count()})`);
  check(!(await page.$('.tour-pickwrap:not([hidden])')), 'выбора страны и обучения для новых нет');
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'light', 'тема пользователя (светлая) сохранилась');
  await shot(page, '1-intro');
  const geo = () => page.evaluate(() => { const r = (e) => { const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; }; const body = document.body.getBoundingClientRect(); return { hole: r(document.querySelector('.tour-hole')), card: r(document.querySelector('.tour-card')), body: { l: body.left, t: body.top, r: body.right, b: body.bottom } }; });
  for (let s = 2; s <= 6; s++) {
    await page.click('.tour-next'); await sleep(1000);
    const g = await geo();
    check((await count()) === `${s} из 6` && g.card.l >= g.body.l - 1 && g.card.r <= g.body.r + 1 && g.card.t >= g.body.t - 1 && g.card.b <= g.body.b + 1 && g.hole.r - g.hole.l > 10, `шаг ${s}: «${await title()}», карточка и подсветка на месте`);
    await shot(page, `${s}-step`);
    if (s === 3) { // закрыли окно на середине: «Что нового» продолжится
      check((await get(page, 'whatsNew')).whatsNew.step === 2, 'прогресс «Что нового» сохранён (шаг 3)');
      await page.reload(); await page.waitForSelector('.row'); await page.waitForSelector('.tour.open'); await sleep(900);
      check((await count()) === '3 из 6', 'после закрытия окна продолжается с того же шага');
    }
  }
  check((await page.textContent('.tour-next')).trim() === 'Понятно', 'последняя кнопка «Понятно»');
  await page.click('.tour-next'); await sleep(800);
  check(!(await page.$('.tour')) && (await get(page, 'whatsNew')).whatsNew.done === true, 'после «Понятно» карточки закрыты и больше не покажутся');
  await page.reload(); await page.waitForSelector('.row'); await sleep(1500);
  check(!(await page.$('.tour')), 'после перезагрузки окна «Что нового» не возвращается');
  await ctx.close();

  // 6. следующий запуск Chrome: ничего нового не показываем
  ctx = await launch(extDir, profile); page = await popup(ctx); await sleep(1500);
  check(!(await page.$('.tour')) && (await get(page, 'whatsNew')).whatsNew.done === true, 'при следующем запуске той же версии «Что нового» не появляется');
  await ctx.close();

  // 7. «Пропустить» у обновившегося запоминается
  await ctx.close().catch(() => {});
  const profile3 = path.join(work, 'profile3');
  ctx = await launch(extDir, profile3); page = await popup(ctx);
  await page.evaluate((p) => chrome.storage.local.remove('tour').then(() => chrome.storage.local.set(p)), upd);   // свежий профиль сам получил бы тур новичка; у обновившегося его нет
  await page.reload(); await page.waitForSelector('.tour.open');
  await page.click('.tour-skip'); await sleep(700);
  check(!(await page.$('.tour')) && (await get(page, 'whatsNew')).whatsNew.done === true && (await get(page, 'whatsNew')).whatsNew.skipped === true, '«Пропустить» закрывает «Что нового» насовсем');
  await ctx.close();

  // 8. новый пользователь: полный тур, а не «Что нового»
  const ins = installedPatch({ reason: 'install' }, newVersion);
  ctx = await launch(extDir, path.join(work, 'profile4')); page = await popup(ctx);
  await page.evaluate((p) => chrome.storage.local.set(p), ins); await page.reload(); await page.waitForSelector('.tour.open');
  check((await count()) === '1 из 8' && !(await get(page, 'whatsNew')).whatsNew, 'новый пользователь видит полный тур (8 шагов), а не «Что нового»');
  await shot(page, '9-new-user');
  await ctx.close();
} finally { try { fs.rmSync(work, { recursive: true, force: true }); } catch { /* временные файлы */ } }
console.log(fails ? `ПРОВАЛОВ: ${fails}` : 'всё хорошо');
process.exit(fails ? 1 : 0);
