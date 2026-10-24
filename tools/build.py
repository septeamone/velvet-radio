"""Собирает чистую production-сборку и ZIP для Chrome Web Store.
Берёт только файлы из белого списка, manifest.json лежит в корне архива. Запуск: python tools/build.py"""
import json, shutil, zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'manifest.json').read_text('utf-8'))['version']

# «Что нового» обязательно в каждом обновлении: карточки подготовлены под ту же версию, что в manifest.json (см. CLAUDE.md, «Выпуск обновления»).
import os, re as _re
_m = _re.search(r"WHATS_NEW_FOR\s*=\s*'([^']+)'", (root / 'lifecycle.js').read_text('utf-8'))
if (not _m or _m.group(1) != version) and not os.environ.get('NO_WHATS_NEW'):
    raise SystemExit(f"Для версии {version} не подготовлено «Что нового» (в lifecycle.js стоит {_m.group(1) if _m else 'ничего'}).\n"
                     "Обновите WHATS_NEW_STEPS в ui/tour.js, тексты wn_* (ru и en) в i18n.js и WHATS_NEW_FOR в lifecycle.js, затем запустите node tools/test-update.mjs.\n"
                     "Если выпуск без видимых изменений, соберите с NO_WHATS_NEW=1 (карточки тогда не покажутся).")
files = ['manifest.json', 'background.js', 'offscreen.html', 'offscreen.js', 'nowplaying.js',
         'stations.js', 'icy-sources.js', 'lifecycle.js', 'i18n.js', 'settings.js', 'popup.html', 'popup.js', 'popup.css', 'popup-v2.css', 'boot.js', 'vendor/hls.min.js', 'flags/LICENSE', 'THIRD_PARTY_NOTICES.md']
files += sorted(p.relative_to(root).as_posix() for d in ('icons', 'logos') for p in (root / d).glob('*.png'))
files += sorted(p.relative_to(root).as_posix() for p in (root / 'icons' / 'anim').glob('*.png'))
files += sorted(p.relative_to(root).as_posix() for p in (root / 'stations').glob('*.js'))
files += sorted(p.relative_to(root).as_posix() for p in (root / 'flags').glob('*.svg'))
files += sorted(p.relative_to(root).as_posix() for p in (root / 'ui').glob('*.js')) + ['ui/ui.css']
files += sorted(p.relative_to(root).as_posix() for p in (root / 'vendor' / 'fonts').glob('*') if p.is_file())
files += sorted(p.relative_to(root).as_posix() for p in (root / '_locales').glob('*/messages.json'))

# Каждый подключаемый модуль (import ... from './x.js') обязан попасть в сборку, иначе окно расширения откроется пустым.
import re
for f in [f for f in files if f.endswith('.js')]:
    for m in re.finditer(r"from '\./([^']+)'", (root / f).read_text('utf-8')):
        dep = (Path(f).parent / m.group(1)).as_posix()
        if dep not in files:
            raise SystemExit(f'В сборке нет файла {dep}, на который ссылается {f}')

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
