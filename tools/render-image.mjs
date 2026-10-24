// Превращает картинку по адресу (SVG и др.) в PNG через скрытый Chromium: node tools/render-image.mjs <url> <out.png>
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--headless=new', '--disable-audio-output'] });
const p = await b.newPage({ viewport: { width: 800, height: 800 }, userAgent: 'Mozilla/5.0 Chrome/130' });
await p.setContent(`<body style="margin:0;background:transparent"><img id=i src="${url}" style="max-width:780px;max-height:780px;display:block;margin:10px"></body>`);
await p.waitForFunction(() => document.getElementById('i').complete, null, { timeout: 20000 });
const img = p.locator('#i');
await img.screenshot({ path: out, omitBackground: true });
await b.close();
