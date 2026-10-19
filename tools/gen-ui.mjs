// Склеивает стили элементов нового вида (ui/*.css) в один файл ui/ui.css: одно обращение к диску вместо четырнадцати, окно открывается быстрее.
//   node tools/gen-ui.mjs        после правки любого ui/*.css запускать заново. ui/ui.css руками не править.
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ui');
// порядок важен: border-glow и другие переопределяют правила предыдущих
const ORDER = ['jelly', 'rubber', 'squish', 'pulse-heart', 'elastic-slider', 'status-mark', 'shiny-text', 'echo-text', 'split-flap', 'spotlight', 'border-glow', 'warm-tooltip', 'glide-select', 'animated-list'];
const extra = fs.readdirSync(dir).filter((f) => f.endsWith('.css') && f !== 'ui.css' && !ORDER.includes(f.slice(0, -4)));
if (extra.length) throw new Error('Нет в списке ORDER: ' + extra.join(', '));
const out = ['/* СГЕНЕРИРОВАНО tools/gen-ui.mjs из ui/*.css. Руками не править. */'];
for (const n of ORDER) out.push(`\n/* ===== ${n}.css ===== */\n` + fs.readFileSync(path.join(dir, n + '.css'), 'utf8').trim());
fs.writeFileSync(path.join(dir, 'ui.css'), out.join('\n') + '\n');
console.log('ui/ui.css:', (fs.statSync(path.join(dir, 'ui.css')).size / 1024).toFixed(1), 'КБ из', ORDER.length, 'файлов');
