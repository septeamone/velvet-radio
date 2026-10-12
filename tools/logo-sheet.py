"""Контрольный лист логотипов для проверки глазами: python tools/logo-sheet.py out.png id1 id2 ...
(без id — все логотипы из logos/). Подписывает каждый id; сетка по 8 в ряд."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
out = sys.argv[1]
ids = sys.argv[2:] or sorted(p.stem for p in (root / 'logos').glob('*.png'))
cols, cell, lab = 8, 128, 16
rows = (len(ids) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (cell + 8) + 8, rows * (cell + lab + 8) + 8), (60, 60, 70))
d = ImageDraw.Draw(sheet)
for i, sid in enumerate(ids):
    x, y = 8 + (i % cols) * (cell + 8), 8 + (i // cols) * (cell + lab + 8)
    f = root / 'logos' / f'{sid}.png'
    if f.exists():
        sheet.paste(Image.open(f).convert('RGB').resize((cell, cell)), (x, y))
    else:
        d.rectangle([x, y, x + cell, y + cell], outline=(255, 80, 80))
        d.text((x + 8, y + 8), 'НЕТ ФАЙЛА', fill=(255, 80, 80))
    d.text((x, y + cell + 2), sid[:22], fill=(255, 255, 255))
sheet.save(out)
print(out, len(ids), 'логотипов')
