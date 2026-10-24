// Ручная проверка «что увидит тот, кто просто обновился», в твоём настоящем Chrome.
//   node tools/update-demo.mjs prepare   распаковать последний опубликованный пакет (store-upload/0-пакет, версия ниже текущей) в папку (как будто пользователь поставил его из магазина)
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
// Последний опубликованный пакет: самый новый velvet-radio-X.Y.Z.zip в store-upload/0-пакет с версией ниже текущей (после выпуска кладём туда пакет выпущенной версии)
const cmpV = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0); return 0; };
function previousPackage(current) {
  const dir = path.join(root, 'store-upload', '0-пакет');
  const found = fs.readdirSync(dir).map((f) => [f, /^velvet-radio-(\d+\.\d+\.\d+)\.zip$/.exec(f)?.[1]]).filter(([, v]) => v && cmpV(v, current) < 0).sort((a, b) => cmpV(b[1], a[1]))[0];
  if (!found) throw new Error('В store-upload/0-пакет нет пакета предыдущей версии (нужен velvet-radio-X.Y.Z.zip ниже ' + current + ')');
  return { zip: path.join(dir, found[0]), version: found[1] };
}

if (cmd === 'prepare') {
  const { zip } = previousPackage(version(root));
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
  console.log('  2. Нажми на значок расширения: откроется короткое «Что нового». Избранное, тема и остальное на месте.');
  console.log('  3. Закрой окно кликом мимо, открой снова: продолжится с того же шага. После «Понятно» больше не появится.');
  console.log('Повторить: node tools/update-demo.mjs prepare, затем в Chrome «Обновить» (вернётся прежняя версия), потом снова apply и «Обновить».');
} else {
  console.log('Использование: node tools/update-demo.mjs prepare | apply [--dir <папка>]');
  process.exit(1);
}
