// Based on React Bits AnimatedList (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
//
// Слой для существующего списка #list (строки .row, страны .crow). Как в оригинале (animation="slide", stagger 0.04, fadeSize 28, в оригинале 56):
//  1) строки, видимые меньше чем на 50%, уходят в скрытое состояние (data-al="above|below": opacity 0, сдвиг, лёгкий scale)
//     и возвращаются на пружинной кривой linear(...) при входе в видимую зону; при первом показе строки появляются со stagger;
//  2) мягкое затухание верхнего и нижнего края списка зависит от scrollTop (mask, 28px); нижний край считается
//     от верха плавающего плеера, чтобы не было двойного затухания с подложкой;
//  3) подсветка выбора с клавиатуры (.kbd, ставит popup.js) — общая рамка, скользит от строки к строке (::after списка).
// Строки двигаются только через независимые свойства translate/scale/opacity (transform остаётся за drag и hover).
// Расходы: один passive scroll-слушатель, rAF планируется только на кадр прокрутки (цикла в покое нет), координаты строк
// кэшируются (пересчёт при пересборке списка и изменении размеров), классы/атрибуты меняются только у строк, чьё состояние сменилось.

const STAGGER = 0.04;

// opts: items — классы элементов (по умолчанию строки станций и стран), player — что перекрывает низ списка (null: ничего), fade — ширина затухания краёв.
// Тот же слой подключается к выпадающему списку стран в настройках (#homeMenu): прокрутка у него такая же, как у списка станций.
export function initAnimatedList(list, { items = ['row', 'crow'], player: playerEl, fade = 28 } = {}) {
  const FADE = fade;
  const app = list.closest('.app') ?? list.parentElement;
  const player = playerEl === undefined ? app.querySelector('.player') : playerEl;
  const known = new WeakSet();
  let rows = [], boxes = [], cover = 0, dirty = true, raf = 0, pendingSort = false;
  let ft = -1, fb = -1, cv = -1;
  let live = false, snapRaf = 0, last = null;
  list.dataset.rbAl = '';

  const isItem = (el) => items.some((c) => el.classList?.contains(c));

  /* ---------- видимость строк ---------- */
  function measure() {
    rows = [...list.children].filter(isItem);
    boxes = rows.map((r) => [r.offsetTop, r.offsetHeight]);
    cover = player ? Math.max(0, Math.round(list.getBoundingClientRect().bottom - player.getBoundingClientRect().top)) : 0;
    dirty = false;
  }

  // 'in' | 'above' | 'below': как в оригинале, скрыта строка, если в видимой зоне меньше 50% её высоты (или высоты зоны, если строка выше неё)
  function stateOf(box, top, view) {
    const start = box[0] - top, h = box[1];
    const overlap = Math.min(view, start + h) - Math.max(0, start);
    if (overlap >= Math.min(h, view) * 0.5) return 'in';
    return start + h / 2 < view / 2 ? 'above' : 'below';
  }

  function fades() {
    const top = list.scrollTop, room = list.scrollHeight - list.clientHeight - top;
    const t = Math.round(Math.min(FADE, Math.max(0, top))), b = Math.round(Math.min(FADE, Math.max(0, room)));
    const s = list.style;
    if (t !== ft) { ft = t; s.setProperty('--rb-al-ft', t + 'px'); }
    if (b !== fb) { fb = b; s.setProperty('--rb-al-fb', b + 'px'); }
    if (cover !== cv) { cv = cover; s.setProperty('--rb-al-cover', cover + 'px'); }
  }

  function update() {
    raf = 0;
    if (list.classList.contains('sorting')) { pendingSort = true; return; }   // во время drag строки не трогаем
    if (dirty) measure();
    fades();
    const top = list.scrollTop, view = Math.max(1, list.clientHeight - cover);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i], now = r.dataset.al ?? 'in', next = stateOf(boxes[i], top, view);
      if (now === next) continue;
      if (r.style.getPropertyValue('--rb-al-d')) r.style.removeProperty('--rb-al-d');
      if (next === 'in') delete r.dataset.al; else r.dataset.al = next;
    }
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

  // Новые строки (после renderList): сразу ставим скрытое состояние без transition, затем строки в зоне видимости выходят со stagger.
  function enter(fresh) {
    measure();
    fades();
    const top = list.scrollTop, view = Math.max(1, list.clientHeight - cover);
    const show = [];
    list.dataset.rbAlBoot = '';
    rows.forEach((r, i) => {
      if (!fresh.includes(r)) return;
      const s = stateOf(boxes[i], top, view);
      r.dataset.al = s === 'in' ? 'below' : s;
      if (s === 'in') show.push(r);
    });
    void list.offsetHeight;
    delete list.dataset.rbAlBoot;
    void list.offsetHeight;
    show.forEach((r, k) => { r.style.setProperty('--rb-al-d', (k * STAGGER).toFixed(2) + 's'); delete r.dataset.al; });
    requestAnimationFrame(() => requestAnimationFrame(() => {      // .ready нужен jelly.css: до него переключатель качества не анимируется
      for (const r of fresh) if (r.isConnected) r.classList.add('ready');
    }));
  }

  /* ---------- подсветка выбора с клавиатуры ---------- */
  function sync() {
    const row = list.querySelector('.kbd');
    if (!row) { if (live) { live = false; last = null; delete list.dataset.rbAlLive; } return; }
    if (row === last && live) return;
    last = row;
    if (dirty) measure();
    if (!live) {                                      // первое появление рамки: сразу на месте
      list.dataset.rbAlSnap = '';
      cancelAnimationFrame(snapRaf);
      snapRaf = requestAnimationFrame(() => { delete list.dataset.rbAlSnap; });
    }
    const s = list.style;
    s.setProperty('--rb-al-x', `${row.offsetLeft}px`);
    s.setProperty('--rb-al-y', `${row.offsetTop}px`);
    s.setProperty('--rb-al-w', `${row.offsetWidth}px`);
    s.setProperty('--rb-al-h', `${row.offsetHeight}px`);
    list.dataset.rbAlLive = '';
    live = true;
    reveal(row);
  }

  // Строка с выбором не должна оказаться под плеером или в зоне затухания: доводим её до видимой зоны (как scrollTo в оригинале).
  function reveal(row) {
    const view = list.clientHeight - cover, h = row.offsetHeight;
    const margin = Math.min(FADE, Math.max(12, (view - h) / 2)), top = row.offsetTop, bottom = top + h;
    if (top < list.scrollTop + margin) list.scrollTo({ top: Math.max(0, top - margin), behavior: 'smooth' });
    else if (bottom > list.scrollTop + view - margin) list.scrollTo({ top: bottom - view + margin, behavior: 'smooth' });
  }

  /* ---------- подключение ---------- */
  list.addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(() => { dirty = true; schedule(); }).observe(list);
  if (player) new ResizeObserver(() => { dirty = true; schedule(); }).observe(player);

  new MutationObserver((records) => {
    let childList = false;
    for (const r of records) if (r.type === 'childList' && r.target === list) { childList = true; break; }
    if (childList) {
      const fresh = [...list.children].filter((el) => isItem(el) && !known.has(el));
      fresh.forEach((el) => known.add(el));
      if (fresh.length) enter(fresh);                  // перенос уже известной строки (drag) только пересчитывает координаты
      else { dirty = true; schedule(); }
    } else if (pendingSort && !list.classList.contains('sorting')) { pendingSort = false; dirty = true; schedule(); }
    sync();
  }).observe(list, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });

  const init = [...list.children].filter(isItem);
  if (init.length) { init.forEach((el) => known.add(el)); enter(init); }
  return { sync, update: schedule };
}
