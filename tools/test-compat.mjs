// Проверка совместимости с версией 1.0.0 (у существующих пользователей ничего не должно пропасть и сломаться):
//  1) разрешения и хосты в manifest.json не изменились (сравнение с эталонной веткой, по умолчанию main);
//  2) у каждой станции каталога 1.0.0 тот же id (на них держатся избранное и порядок);
//  3) старые данные из хранилища 1.0.0 (избранное, порядок, качество) читаются новым окном без ошибок.
//   node tools/test-compat.mjs [ветка-эталон]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] ?? 'main';
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
let bad = 0;
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) bad++; };

// 1. разрешения
const oldM = JSON.parse(git('show', `${base}:manifest.json`)), newM = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
check(same(oldM.permissions, newM.permissions), `permissions: ${newM.permissions.join(', ')}`);
check(same(oldM.host_permissions ?? [], newM.host_permissions ?? []), `host_permissions: ${(newM.host_permissions ?? []).length} шт., как в ${base}`);
check(!newM.optional_permissions && !newM.optional_host_permissions && !newM.content_scripts && !newM.externally_connectable, 'нет optional/content_scripts/externally_connectable');

// 2. id станций 1.0.0
const oldSrc = git('show', `${base}:stations.js`);
const oldIds = [...oldSrc.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map((m) => m[1]);
const { STATIONS } = await import(pathToFileURL(path.join(root, 'stations.js')).href);
const ids = new Set(STATIONS.map((s) => s.id));
const lost = oldIds.filter((i) => !ids.has(i));
check(oldIds.length > 0 && !lost.length, `id станций ${base}: ${oldIds.length}, потеряно: ${lost.join(', ') || 'нет'}`);

// 3. старое хранилище в новом окне
function chromeExe() {
  const b = path.join(os.homedir(), 'AppData/Local/ms-playwright');
  for (const d of fs.readdirSync(b).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) { const e = path.join(b, d, 'chrome-win64/chrome.exe'); if (fs.existsSync(e)) return e; }
  throw new Error('нет Chromium');
}
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-test-prof-'));
const ctx = await chromium.launchPersistentContext(prof, { executablePath: chromeExe(), headless: false, viewport: { width: 480, height: 600 },
  args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-first-run'] });
const errors = [];
try {
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`chrome-extension://${sw.url().split('/')[2]}/popup.html`);
  // как у пользователя 1.0.0: избранное, порядок только из 21 станции, сохранённое качество, тема, последняя станция (ни lang, ни view, ни settings)
  const order = ['nashe', 'ultra', 'europaplus', ...oldIds.filter((i) => !['nashe', 'ultra', 'europaplus'].includes(i))];
  await page.evaluate(([o]) => chrome.storage.local.clear().then(() => chrome.storage.local.set({ tour: { v: 1, done: true }, favs: ['ultra', 'record', 'bbc1xtra'], order: o, quality: { ultra: 128, europaplus: 320 }, theme: 'dark', last: 'nashe', volume: 0.5 })), [order]);
  await page.reload(); await page.waitForSelector('#list .row');
  const first = await page.evaluate(() => [...document.querySelectorAll('#list .row')].slice(0, 3).map((r) => r.dataset.id));
  check(JSON.stringify(first) === JSON.stringify(['nashe', 'ultra', 'europaplus']), `порядок станций сохранился: ${first.join(', ')}`);
  const selected = await page.evaluate(() => ({ ultra: document.querySelector('.row[data-id=ultra] .seg button.on')?.dataset.k, europa: document.querySelector('.row[data-id=europaplus] .seg button.on')?.dataset.k }));
  check(selected.ultra === '128' && selected.europa === '320', `выбранное качество сохранилось: ultra ${selected.ultra}, europaplus ${selected.europa}`);
  await page.click('.tabs [data-tab=fav]'); await page.waitForTimeout(300);
  const favs = await page.evaluate(() => [...document.querySelectorAll('#list .row')].map((r) => r.dataset.id).sort());
  check(JSON.stringify(favs) === JSON.stringify(['bbc1xtra', 'record', 'ultra']), `избранное сохранилось (в том числе станция, которая теперь в «Великобритании»): ${favs.join(', ')}`);
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'тема сохранилась');
  const ruCount = await page.evaluate(() => (document.querySelector('.tabs [data-tab=all]').click(), document.querySelectorAll('#list .row').length));
  check(ruCount === STATIONS.filter((s) => s.country === 'RU').length, `вкладка «Россия»: ${ruCount} станций`);
  check(!errors.length, errors.length ? 'ошибки страницы: ' + errors.join('; ') : 'ошибок страницы нет');
} finally { await ctx.close().catch(() => {}); fs.rmSync(prof, { recursive: true, force: true }); }
console.log(bad ? `\nПРОВАЛЕНО: ${bad}` : '\nсовместимость в порядке');
process.exit(bad ? 1 : 0);
