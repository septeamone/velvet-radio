// Ручная проверка «что увидит тот, кто просто обновился», в твоём настоящем Chrome.
//   node tools/update-demo.mjs prepare   распаковать опубликованный пакет 1.6.0 в папку (как будто пользователь поставил его из магазина)
//   node tools/update-demo.mjs apply     собрать новую версию и заменить файлы в той же папке (как это сделал бы магазин при обновлении)
// Папка по умолчанию: Рабочий стол\velvet-radio-update-test (другая: --dir <путь>).
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cmd = process.argv[2];
const di = process.argv.indexOf('--dir');
const dir = di > 0 ? path.resolve(process.argv[di + 1]) : path.join(os.homedir(), 'Desktop', 'velvet-radio-update-test');
const version = (d) => JSON.parse(fs.readFileSync(path.join(d, 'manifest.json'), 'utf8')).version;

if (cmd === 'prepare') {
  const zip = path.join(root, 'store-upload', '0-пакет', 'velvet-radio-1.6.0.zip');
  fs.rmSync(dir, { recursive: true, force: true });
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${dir}' -Force`]);
  console.log(`Готово: в папке ${dir} версия ${version(dir)} (как у пользователей из магазина).\n`);
  console.log('Дальше в Chrome:');
  console.log('  1. chrome://extensions → включи «Режим разработчика» → «Загрузить распакованное расширение» → выбери эту папку.');
  console.log('  2. Пользуйся как обычный пользователь: добавь станции в избранное, поменяй тему, запусти станцию.');
  console.log('  3. Потом выполни:  node tools/update-demo.mjs apply');
} else if (cmd === 'apply') {
  if (!fs.existsSync(path.join(dir, 'manifest.json'))) { console.error('Сначала: node tools/update-demo.mjs prepare'); process.exit(1); }
  const was = version(dir);
  const b = spawnSync('python', [path.join(root, 'tools/build.py')], { cwd: root, encoding: 'utf8' });
  if (b.status !== 0) { console.error('Сборка не прошла:\n' + b.stdout + b.stderr); process.exit(1); }
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  fs.cpSync(path.join(root, 'dist', 'build'), dir, { recursive: true });
  console.log(`Файлы заменены: ${was} → ${version(dir)}.\n`);
  console.log('Теперь в Chrome:');
  console.log('  1. chrome://extensions → на карточке Velvet Radio нажми круглую стрелку «Обновить» (так Chrome обновляет расширение при выходе новой версии).');
  console.log('  2. Нажми на значок расширения: откроется короткое «Что нового» (6 карточек). Избранное, тема и остальное на месте.');
  console.log('  3. Закрой окно кликом мимо, открой снова: продолжится с того же шага. После «Понятно» больше не появится.');
  console.log('Повторить: node tools/update-demo.mjs prepare, затем в Chrome «Обновить» (вернётся 1.6.0), потом снова apply и «Обновить».');
} else {
  console.log('Использование: node tools/update-demo.mjs prepare | apply [--dir <папка>]');
  process.exit(1);
}
