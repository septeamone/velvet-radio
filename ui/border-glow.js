// Based on React Bits BorderGlow (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// Тонкая светящаяся кромка у ОДНОЙ выбранной строки списка (по умолчанию `.row.cur`): световой клин на кромке
// поворачивается к курсору и усиливается у краёв. Один делегированный слушатель на список и один общий overlay,
// который сам переезжает в нужную строку (после renderList и смены класса `cur`; MutationObserver).
// Использование: const bg = initBorderGlow(document.querySelector('#list'));  ->  { sync(), destroy() }

export function initBorderGlow(list, { selector = '.row.cur', sensitivity = 0.35 } = {}) {
  if (!list) return null;
  if (list.__rbBorderGlow) return list.__rbBorderGlow;
  const ov = Object.assign(document.createElement('span'), { className: 'rb-bg-edge' });
  ov.setAttribute('aria-hidden', 'true');
  let host = null, raf = 0, px = 0, py = 0, on = false;

  const setOn = (v) => { if (on !== v) { on = v; ov.classList.toggle('rb-bg-on', v); } };
  const sync = () => {
    const cur = list.querySelector(selector);
    if (cur === host && (!cur || ov.parentNode === cur)) return;
    host = cur; setOn(false);
    if (cur) cur.append(ov); else ov.remove();
  };
  const flush = () => {
    raf = 0;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const w = r.width, h = r.height;
    if (!w || !h) return;
    const dx = px - r.left - w / 2, dy = py - r.top - h / 2;
    let a = Math.atan2(dy, dx) * 180 / Math.PI + 90; if (a < 0) a += 360;
    // близость к краю: 0 в центре, 1 на кромке (как в оригинале)
    const k = Math.min(1, Math.max(Math.abs(dx) / (w / 2), Math.abs(dy) / (h / 2)));
    const e = Math.min(1, Math.max(0, (k - sensitivity) / (1 - sensitivity)));
    ov.style.setProperty('--rb-bg-angle', a.toFixed(1) + 'deg');
    ov.style.setProperty('--rb-bg-k', e.toFixed(3));
  };
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    if (!host || !host.contains(e.target) || host.classList.contains('dragging')) { setOn(false); return; }
    px = e.clientX; py = e.clientY;
    if (!on) { flush(); setOn(true); } else if (!raf) raf = requestAnimationFrame(flush);
  };
  const leave = () => { setOn(false); if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  const hide = () => { if (document.hidden) leave(); };

  const mo = new MutationObserver(sync);
  mo.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  list.addEventListener('pointermove', move, { passive: true });
  list.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', hide);
  sync();
  const api = {
    sync,
    destroy() {
      mo.disconnect(); leave();
      list.removeEventListener('pointermove', move); list.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', hide);
      ov.remove(); delete list.__rbBorderGlow;
    },
  };
  list.__rbBorderGlow = api;
  return api;
}
