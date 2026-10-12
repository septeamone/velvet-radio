"""Приводит графику магазина к размерам Chrome Web Store: скриншоты и «Что нового» 1280x800, малая плитка 440x280, PNG без прозрачности.
Запуск: python tools/store-resize.py [папка docs/store]. Промежуточные popup*.png удаляются."""
import sys
from pathlib import Path
from PIL import Image

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / 'docs' / 'store'
for f in sorted(root.glob('*/*.png')):
    if f.name.startswith('popup'):
        f.unlink(); continue
    size = (440, 280) if f.name.startswith('small-promo') else (1280, 800)
    im = Image.open(f).convert('RGB')
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    im.save(f, optimize=True)
    print(f.relative_to(root), size)
