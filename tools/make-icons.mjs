// Рисует значки расширения (панель Chrome и магазин) из SVG скрытым Chromium и кладёт PNG в icons/.
//   node tools/make-icons.mjs
// Состояния: idle (графитовая плитка), on (светлая плитка), кадры «дыхания» (контур гаснет и разгорается) при подключении и «вспышка» в момент старта звука (icons/anim).
// Анимацию в панели Chrome делает background.js, подменяя кадры; здесь только картинки.
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASPHALT = ['#2b2d32', '#1a1b1e'], CHAMP = ['#e0c998', '#bf9f67'], INK = '#17181b', GOLD = '#d4b87f';
const mix = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const [x, y] = [p(a), p(b)]; return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

// stroke зависит от размера: на 16 px тонкая линия исчезает
const sw = (size) => (size <= 16 ? 11 : size <= 32 ? 8.5 : 6.5);
function glyph(size, color) {
  const w = sw(size), g = Math.round(w * .8 * 10) / 10;
  const grille = size <= 16 ? '' : [42, 54, 66].map((x) => `<line x1="${x}" y1="70" x2="${x}" y2="82" stroke-width="${g}"/>`).join('');
  return `<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${w}">
    <rect x="25" y="50" width="78" height="50" rx="15"/><line x1="76" y1="50" x2="98" y2="22"/>${grille}<circle cx="${size <= 16 ? 64 : 83}" cy="75" r="${size <= 16 ? 6 : 9}"/></g>`;
}
function tile(size, [top, bot], id) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs>
  <rect x="4" y="4" width="120" height="120" rx="30" fill="url(#${id})"/><rect x="4.75" y="4.75" width="118.5" height="118.5" rx="29.5" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1.5"/>`;
}
const svg = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">${body}</svg>`;
const idle = (s) => svg(s, tile(s, ASPHALT, 'a') + glyph(s, GOLD));
const on = (s) => svg(s, tile(s, CHAMP, 'c') + glyph(s, INK));
const breathe = (s, t) => svg(s, tile(s, ASPHALT, 'a') + `<g opacity="${(0.3 + 0.7 * t).toFixed(2)}">${glyph(s, GOLD)}</g>`);   // контур радио гаснет и разгорается, плитка не меняется
const wipe = (s, p) => svg(s, tile(s, ASPHALT, 'a') + glyph(s, GOLD) + `<clipPath id="w"><rect x="0" y="0" width="${128 * p}" height="128"/></clipPath><g clip-path="url(#w)">${tile(s, CHAMP, 'c') + glyph(s, INK)}</g>`);

const jobs = [];
for (const s of [16, 32, 48, 128]) { jobs.push([`icons/idle${s}.png`, idle(s), s]); jobs.push([`icons/on${s}.png`, on(s), s]); }
for (const s of [16, 32]) {
  for (let i = 0; i < 8; i++) jobs.push([`icons/anim/load${i}-${s}.png`, breathe(s, (1 - Math.cos(2 * Math.PI * i / 8)) / 2), s]);   // 8 кадров дыхания
  [0.18, 0.4, 0.62, 0.82, 0.95].forEach((p, i) => jobs.push([`icons/anim/start${i}-${s}.png`, wipe(s, p), s]));                       // вспышка при старте
}
fs.mkdirSync(path.join(root, 'icons/anim'), { recursive: true });
const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const exe = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse().map((d) => path.join(base, d, 'chrome-win64/chrome.exe')).find(fs.existsSync);
const browser = await chromium.launch({ executablePath: exe, headless: false, args: ['--headless=new', '--disable-audio-output'] });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [file, markup, s] of jobs) {
    await page.setViewportSize({ width: s, height: s });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${markup}`);
    await page.screenshot({ path: path.join(root, file), omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
  }
  console.log('значков нарисовано:', jobs.length);
} finally { await browser.close(); }
