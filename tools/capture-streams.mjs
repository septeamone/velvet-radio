// Открывает сайт станции скрыто и без звука, жмёт «играть» и печатает адреса аудио/HLS, которые запрашивает плеер.
//   node tools/capture-streams.mjs https://radiovera.ru/ [https://...]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function chromeExe() {
  const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
  for (const d of fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) { const e = path.join(base, d, 'chrome-win64/chrome.exe'); if (fs.existsSync(e)) return e; }
  throw new Error('Chromium из ms-playwright не найден');
}
const AUDIO = process.env.ALL ? /./ : /\.(mp3|aacp?|m3u8|ogg)(\?|$)|icecast|:\d{4}\/[\w-]+$|\/(stream|live|listen|radio)\b|audio\/|myradio24|radioking|zeno|cdnvideo|hostingradio|mediacdn|emgsound|\/fm\b/i;
const SKIP = /\.(js|css|png|jpe?g|svg|gif|webp|woff2?|ico)(\?|$)|google|yandex|vk\.com|facebook|metrika|doubleclick|redbasset|\/wp-content\//i;
const browser = await chromium.launch({ executablePath: chromeExe(), headless: true, args: ['--headless=new', '--disable-audio-output', '--autoplay-policy=no-user-gesture-required'] });
for (const url of process.argv.slice(2)) {
  const page = await (await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36' })).newPage();
  const seen = new Set();
  page.on('request', (r) => { const u = r.url(); if (!SKIP.test(u) && AUDIO.test(u) && !seen.has(u)) { seen.add(u); console.log('  ', u.slice(0, 200)); } });
  console.log('==', url);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    for (const sel of ['[class*=play i]', '[aria-label*=play i]', '[aria-label*=слуш i]', 'button:has-text("Слушать")', 'a:has-text("Слушать")', '.fa-play', '[id*=play i]']) {
      const el = page.locator(sel).first();
      if (await el.count()) { await el.click({ timeout: 2000, force: true }).catch(() => {}); await page.waitForTimeout(2500); }
    }
    await page.waitForTimeout(3000);
  } catch (e) { console.log('   ошибка', e.message.split('\n')[0]); }
  await page.context().close();
}
await browser.close();
