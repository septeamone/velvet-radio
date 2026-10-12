// Скрытый тест воспроизведения: Chromium в режиме --headless=new --disable-audio-output (нулевой звуковой выход: звука нет вообще),
// расширение через --load-extension. НЕ используй --mute-audio в длинных тестах: Chrome считает такой звук неслышимым и через 30 с
// закрывает аудио-документ расширения (offscreen), после чего тест «зависает» на подключении.
// Никаких видимых окон, фокуса и звука (пользователь может играть). Правила: ADDING-STATIONS.md, шаг 9.
//
//   node tools/test-playback.mjs                       быстрый режим: все станции, все видимые качества, ~12 с на каждое
//   node tools/test-playback.mjs --mode full           полный: 60 с на качество (заикания)
//   node tools/test-playback.mjs --ids nashe,ultra     только эти станции
//   node tools/test-playback.mjs --scenario mirror|tier|all --ids nashe
//        сломать первый адрес (должно переключиться на зеркало) / всё высшее качество (упасть на ниже) / всё (ошибка)
//   --concurrency 3   сколько браузеров параллельно (по умолчанию 3)
//   --fresh           новый браузер на каждую проверку (в долгих сериях обычный режим иногда «залипает» на подключении)
//   --ext <папка>     какое расширение грузить (по умолчанию корень репозитория)
//   --out <файл.json> сохранить результаты
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const mode = arg('--mode', 'quick'), scenario = arg('--scenario', null), fresh = process.argv.includes('--fresh');   // --fresh: новый браузер на каждую проверку (надёжнее в длинных сериях)
const only = arg('--ids', null)?.split(',');
const conc = +arg('--concurrency', 3);
const extSrc = path.resolve(arg('--ext', root));
const DWELL = mode === 'full' ? 60000 : 12000, CONNECT = mode === 'full' ? 70000 : 45000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chromeExe() {
  const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
  const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) { const e = path.join(base, d, 'chrome-win64/chrome.exe'); if (fs.existsSync(e)) return e; }
  throw new Error('Chromium из ms-playwright не найден');
}

// Копия расширения (только нужные файлы), при сценарии ломаем адреса станции
function stage(scn, id) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-test-ext-'));
  const skip = new Set(['.git', 'node_modules', 'docs', 'dist', 'tools', '.github', 'scratch']);
  (function copy(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      if (skip.has(e.name) || (from === extSrc && /\.(md|zip)$/i.test(e.name))) continue;
      const a = path.join(from, e.name), b = path.join(to, e.name);
      e.isDirectory() ? copy(a, b) : fs.copyFileSync(a, b);
    }
  })(extSrc, dir);
  if (scn) {
    const dead = 'https://127.0.0.1:9/dead';
    fs.appendFileSync(path.join(dir, 'stations.js'), `
for (const s of STATIONS) if (s.id === ${JSON.stringify(id)}) {
  const dead = ${JSON.stringify(dead)};
  const tiers = ${JSON.stringify(scn)} === 'all' ? s.qualities : [s.qualities.filter((q) => !q.hide).at(-1)];
  for (const q of tiers) q.urls = ${JSON.stringify(scn)} === 'mirror' ? [dead, ...q.urls.slice(1).length ? q.urls.slice(1) : q.urls] : q.urls.map(() => dead);
}
`);
  }
  return dir;
}

async function launch(ext) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-test-prof-'));
  const ctx = await chromium.launchPersistentContext(prof, {
    executablePath: chromeExe(), headless: false,
    args: ['--headless=new', '--disable-audio-output', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--no-first-run', '--no-default-browser-check'],
  });
  const sw = ctx.serviceWorkers()[0] ?? await ctx.waitForEvent('serviceworker');
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${sw.url().split('/')[2]}/popup.html`);
  return { ctx, page, prof };
}

const state = (page) => page.evaluate(() => chrome.runtime.sendMessage({ type: 'get-state' }));

async function testQuality(page, st, kbps) {
  const r = { id: st.id, kbps, ok: false };
  await page.evaluate(([id, k]) => chrome.runtime.sendMessage({ type: 'play', id, kbps: k }), [st.id, kbps]);
  const t0 = Date.now(); const seen = new Set(); let s;
  while (Date.now() - t0 < CONNECT) {
    await sleep(500); s = await state(page);
    if (s.notice) seen.add(s.notice);
    if (s.status === 'playing' || s.status === 'error') break;
  }
  r.connectS = +((Date.now() - t0) / 1000).toFixed(1);
  r.status = s.status; r.playedKbps = s.kbps; r.viz = !!s.viz; r.notices = [...seen];
  if (s.status === 'playing') {
    const t1 = Date.now(); let bad = 0;
    while (Date.now() - t1 < DWELL) { await sleep(1000); s = await state(page); if (s.status !== 'playing') bad++; }
    r.stalls = s.stalls ?? 0; r.track = s.track ?? null; r.finalStatus = s.status; r.notices = [...new Set([...r.notices, ...(s.notice ? [s.notice] : [])])];
    r.ok = s.status === 'playing' && bad < Math.ceil(DWELL / 1000 / 5);
  }
  await page.evaluate(() => chrome.runtime.sendMessage({ type: 'stop' }));
  return r;
}

function killOurs() {
  try {
    execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*vr-test-pro[f]-*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
  } catch { /* нечего убивать */ }
  const left = execSync(`powershell -NoProfile -Command "(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*vr-test-pro[f]-*' } | Measure-Object).Count"`).toString().trim();
  return +left;
}

async function main() {
  const { STATIONS, shown } = await import(pathToFileURL(path.join(extSrc, 'stations.js')).href);
  const list = STATIONS.filter((s) => !only || only.includes(s.id));
  const jobs = list.flatMap((s) => (scenario ? [[s, shown(s).at(-1).kbps]] : shown(s).map((q) => [s, q.kbps])));
  const results = []; let next = 0; const cleanup = [];
  console.log(`режим: ${mode}${scenario ? ', сценарий: ' + scenario : ''}; станций: ${list.length}, проверок: ${jobs.length}, браузеров: ${conc}`);

  await Promise.all(Array.from({ length: Math.min(conc, jobs.length) }, async () => {
    let cur = null;
    try {
      while (next < jobs.length) {
        const [st, kb] = jobs[next++];
        if (scenario || fresh || !cur) { // сценарию нужна своя копия расширения под станцию
          if (cur) await cur.ctx.close().catch(() => {});
          const ext = stage(scenario, st.id); cleanup.push(ext);
          cur = await launch(ext); cleanup.push(cur.prof);
        }
        const r = await testQuality(cur.page, st, kb);
        results.push(r);
        console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${st.id.padEnd(14)} ${String(kb).padStart(3)}k  → ${r.status}${r.playedKbps !== kb ? ' (' + r.playedKbps + 'k)' : ''} ${r.connectS}s stalls:${r.stalls ?? '-'} viz:${r.viz ? 'да' : 'нет'}${r.track ? ' «' + r.track + '»' : ''}${r.notices.length ? ' [' + r.notices.join('; ') + ']' : ''}`);
      }
    } finally { await cur?.ctx.close().catch(() => {}); }
  }));

  const bad = results.filter((r) => !r.ok);
  console.log(`\nитого: ${results.length - bad.length}/${results.length} OK`);
  for (const r of bad) console.log('  проблема:', r.id, r.kbps + 'k', r.status);
  const out = arg('--out', null); if (out) fs.writeFileSync(out, JSON.stringify(results, null, 1));
  const left = killOurs();
  for (const d of cleanup) fs.rmSync(d, { recursive: true, force: true });
  console.log(`тестовых процессов осталось: ${left}`);
  process.exit(bad.length ? 1 : 0);
}
main().catch((e) => { console.error(e); killOurs(); process.exit(2); });
