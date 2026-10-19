// Based on React Bits ChromaGrid (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// Плитки стран приглушены (флаг почти серый), у курсора цвет возвращается мягким кругом. Работает только в виде «плитки»
// и только пока курсор над списком: pointermove -> один проход за кадр, на каждую плитку пишется --rb-cg-k (0..1, сила цвета).
// В покое ни rAF, ни таймеров. Использование: initChromaGrid(document.getElementById('list'))  ->  { destroy() }

const R = 120;                                   // радиус круга цвета, px
const smooth = (t) => t * t * (3 - 2 * t);

export function initChromaGrid(list) {
  if (!list) return null;
  if (list.__rbChroma) return list.__rbChroma;
  let raf = 0, px = 0, py = 0, inside = false;
  const tiles = () => (list.classList.contains('tiles') ? list.querySelectorAll('.crow') : []);

  const flush = () => {
    raf = 0;
    if (!inside) return;
    const items = tiles();
    if (!items.length) return;
    const rects = [];
    for (const el of items) rects.push(el.getBoundingClientRect());     // сначала все чтения, потом записи
    items.forEach((el, i) => {
      const r = rects[i];
      const dx = Math.max(r.left - px, 0, px - r.right), dy = Math.max(r.top - py, 0, py - r.bottom);   // расстояние до края плитки
      const k = smooth(Math.max(0, 1 - Math.hypot(dx, dy) / R));
      const v = (Math.round(k * 50) / 50).toFixed(2);
      if (el.__rbCg !== v) { el.__rbCg = v; el.style.setProperty('--rb-cg-k', v); }
    });
  };
  const queue = () => { if (!raf && inside) raf = requestAnimationFrame(flush); };
  const reset = () => {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    for (const el of list.querySelectorAll('.crow')) if (el.__rbCg) { el.__rbCg = ''; el.style.removeProperty('--rb-cg-k'); }
  };
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY; inside = true; queue();
  };
  const leave = () => { inside = false; reset(); };
  const hide = () => { if (document.hidden) leave(); };
  const mo = new MutationObserver(() => { if (inside) queue(); });         // список перерисовался под курсором
  mo.observe(list, { childList: true });

  list.addEventListener('pointermove', move, { passive: true });
  list.addEventListener('pointerleave', leave);
  list.addEventListener('scroll', queue, { passive: true });
  document.addEventListener('visibilitychange', hide);
  const api = {
    destroy() {
      leave(); mo.disconnect();
      list.removeEventListener('pointermove', move); list.removeEventListener('pointerleave', leave); list.removeEventListener('scroll', queue);
      document.removeEventListener('visibilitychange', hide); delete list.__rbChroma;
    },
  };
  list.__rbChroma = api;
  return api;
}
