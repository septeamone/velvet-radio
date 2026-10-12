"""Собирает чистую production-сборку и ZIP для Chrome Web Store.
Берёт только файлы из белого списка, manifest.json лежит в корне архива. Запуск: python tools/build.py"""
import json, shutil, zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'manifest.json').read_text('utf-8'))['version']
files = ['manifest.json', 'background.js', 'offscreen.html', 'offscreen.js', 'nowplaying.js',
         'stations.js', 'i18n.js', 'popup.html', 'popup.js', 'popup.css', 'vendor/hls.min.js', 'flags/LICENSE']
files += sorted(p.relative_to(root).as_posix() for d in ('icons', 'logos') for p in (root / d).glob('*.png'))
files += sorted(p.relative_to(root).as_posix() for p in (root / 'stations').glob('*.js'))
files += sorted(p.relative_to(root).as_posix() for p in (root / 'flags').glob('*.svg'))
files += sorted(p.relative_to(root).as_posix() for p in (root / '_locales').glob('*/messages.json'))

build = root / 'dist' / 'build'
shutil.rmtree(build, ignore_errors=True)
for f in files:
    (build / f).parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / f, build / f)

out = root / 'dist' / f'velvet-radio-{version}.zip'
out.unlink(missing_ok=True)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(build / f, f)
print(out, len(files), 'files')
