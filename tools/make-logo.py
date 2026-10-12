"""Делает логотип станции: logos/<id>.png, квадрат 128x128.
Использование: python tools/make-logo.py <id> <файл-или-url> [--dark] [--light]
Правила (ADDING-STATIONS.md §6): квадратные непрозрачные ставим как есть; прозрачные и широкие кладём на плитку
(белую, для светлых логотипов тёмную) с отступом. --dark / --light принудительно задают плитку. SVG не поддерживается
(сначала превратить в PNG через Chrome headless). Результат ОБЯЗАТЕЛЬНО посмотреть глазами (tools/logo-sheet.py)."""
import io, sys, urllib.request
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
S = 128

def load(src):
    if src.startswith(('http://', 'https://')):
        req = urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0 Chrome/130'})
        data = urllib.request.urlopen(req, timeout=20).read()
        return Image.open(io.BytesIO(data))
    return Image.open(src)

def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    flags = [x for x in sys.argv[1:] if x.startswith('--')]
    sid, src = a[0], a[1]
    im = load(src)
    try: im.seek(0)
    except Exception: pass
    im = im.convert('RGBA')
    w, h = im.size
    alpha = im.getchannel('A')
    transp = sum(1 for v in alpha.getdata() if v < 250) / (w * h)
    square = 0.85 <= w / h <= 1.18
    if square and transp < 0.02 and '--dark' not in flags and '--light' not in flags:
        out = im.convert('RGB').resize((S, S), Image.LANCZOS); mode = 'как есть'
    else:
        px = [(r, g, b) for r, g, b, al in im.getdata() if al > 128]
        lum = sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px) / max(1, len(px))
        dark_tile = ('--dark' in flags) or ('--light' not in flags and lum > 205)
        bg = (21, 21, 28) if dark_tile else (255, 255, 255)
        out = Image.new('RGB', (S, S), bg)
        pad = 14; box = S - 2 * pad
        k = min(box / w, box / h)
        r = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
        out.paste(r, ((S - r.width) // 2, (S - r.height) // 2), r)
        mode = 'на ' + ('тёмной' if dark_tile else 'белой') + ' плитке'
    dst = root / 'logos' / f'{sid}.png'
    dst.parent.mkdir(exist_ok=True)
    out.save(dst, optimize=True)
    print(f'{dst.name}: {w}x{h} -> {S}x{S}, {mode}')

main()
