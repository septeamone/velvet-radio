"""Ищет кандидатов в логотипы для станций, у которых его нет (Википедия en/ru и radio-browser), кладёт их в папку и строит контрольные листы.
Использование: python tools/find-logos.py <папка-для-кандидатов> [id1,id2,…]
Дальше кандидаты смотрятся глазами по листам, подходящие принимаются: python tools/find-logos.py <папка> --accept id1=src,id2=src …
Автоматически ничего в logos/ не попадает, пока человек не принял."""
import io, json, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
UA = {'User-Agent': 'VelvetRadio-tools/1.5 (logo search; https://github.com/septeamone/velvet-radio)'}
S = 128


def get(url, binary=False, timeout=20):
    for attempt in range(3):
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()
            return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(4 * (attempt + 1)); continue
            return None
        except Exception:
            return None
    return None


def to_logo(im):
    """Как tools/make-logo.py: квадратные непрозрачные как есть, остальные на плитке с отступом."""
    im = im.convert('RGBA'); w, h = im.size
    a = im.getchannel('A'); transp = sum(1 for v in a.getdata() if v < 250) / (w * h)
    if 0.85 <= w / h <= 1.18 and transp < 0.02:
        return im.convert('RGB').resize((S, S), Image.LANCZOS)
    px = [(r, g, b) for r, g, b, al in im.getdata() if al > 128]
    lum = sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px) / max(1, len(px))
    bg = (21, 21, 28) if lum > 205 else (255, 255, 255)
    t = Image.new('RGB', (S, S), bg); box = S - 28; k = min(box / w, box / h)
    r = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    t.paste(r, ((S - r.width) // 2, (S - r.height) // 2), r)
    return t


def candidates(st):
    name = st['name'].split('(')[0].strip()
    qs = [name] + ([st['alt'].split()[0]] if st.get('alt') and False else [])
    c = []
    for lang in ('en', 'ru'):
        url = (f'https://{lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(name + (" радио" if lang == "ru" else " radio"))}'
               '&gsrlimit=2&prop=pageimages&pithumbsize=256&format=json')
        j = get(url)
        for p in sorted(((j or {}).get('query', {}).get('pages', {})).values(), key=lambda p: p.get('index', 9)):
            if p.get('thumbnail'): c.append((f'wiki-{lang}', p['thumbnail']['source'], p['title']))
        time.sleep(0.4)
    q = urllib.parse.urlencode({'name': name, 'countrycode': st['country'], 'limit': 6, 'hidebroken': 'true', 'order': 'votes', 'reverse': 'true'})
    for host in ('de1', 'de2', 'nl1'):
        j = get(f'https://{host}.api.radio-browser.info/json/stations/search?{q}')
        if j is not None:
            for s in j:
                if s.get('favicon'): c.append(('rb', s['favicon'], s['name']))
            break
    return c


def main():
    if '--accept' in sys.argv:
        for pair in sys.argv[sys.argv.index('--accept') + 1].split(','):
            sid, src = pair.split('=')
            f = out / f'{sid}.{src}.png'
            if not f.exists(): print('нет кандидата', f.name); continue
            Image.open(f).convert('RGB').save(root / 'logos' / f'{sid}.png', optimize=True); print('принято', sid, src)
        return
    ids = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    dump = subprocess.run(['node', '-e', "import('file:///' + process.argv[1].replace(/\\\\/g,'/') + '/stations.js').then(m=>console.log(JSON.stringify(m.STATIONS.filter(s=>!m.LOGOS.has(s.id)).map(s=>({id:s.id,name:s.name,country:s.country,alt:s.alt})))))", str(root)], capture_output=True, text=True, encoding='utf-8').stdout
    todo = json.loads(dump)
    if ids: todo = [s for s in todo if s['id'] in ids]
    print('ищу для', len(todo), 'станций')
    rows = []
    for st in todo:
        got = 0
        for src, url, title in candidates(st):
            data = get(url, binary=True)
            if not data: continue
            try: im = Image.open(io.BytesIO(data)); im.load()
            except Exception: continue
            if min(im.size) < 64 or im.format in ('GIF',) and getattr(im, 'is_animated', False): continue
            tag = f'{src}{got}'
            to_logo(im).save(out / f'{st["id"]}.{tag}.png'); rows.append((st['id'], tag, title, im.size)); got += 1
            if got >= 3: break
        print(st['id'], 'кандидатов:', got)
    json.dump(rows, open(out / 'index.json', 'w', encoding='utf-8'), ensure_ascii=False)
    # контрольные листы по 30 кандидатов
    cell, cols = 128, 6
    for n in range(0, len(rows), 30):
        chunk = rows[n:n + 30]; rws = (len(chunk) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * (cell + 8) + 8, rws * (cell + 30) + 8), (60, 60, 70)); d = ImageDraw.Draw(sheet)
        for i, (sid, tag, title, size) in enumerate(chunk):
            x, y = 8 + (i % cols) * (cell + 8), 8 + (i // cols) * (cell + 30)
            sheet.paste(Image.open(out / f'{sid}.{tag}.png'), (x, y))
            d.text((x, y + cell + 2), f'{sid}', fill=(255, 255, 255)); d.text((x, y + cell + 14), f'{tag} {size[0]}px', fill=(180, 220, 255))
        sheet.save(out / f'sheet-{n // 30 + 1}.png')
    print('листов:', (len(rows) + 29) // 30, ' кандидатов:', len(rows))


main()
