// Based on React Bits SpotlightCard (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// Мягкий блик-прожектор на поверхности, следует за курсором и цепляет кромку. Без циклов анимации: только на pointermove, не чаще раза в кадр.
// Использование: initSpotlight(document.querySelector('.player'));  ->  { destroy() }
// Разметка: к элементу добавляются два пустых <span aria-hidden> (свет и кромка), сам элемент должен быть position: relative/absolute.

export function initSpotlight(el) {
  if (!el) return null;
  if (el.__rbSpotlight) return el.__rbSpotlight;
  const light = Object.assign(document.createElement('span'), { className: 'rb-spotlight-light' });
  const edge = Object.assign(document.createElement('span'), { className: 'rb-spotlight-edge' });
  light.setAttribute('aria-hidden', 'true'); edge.setAttribute('aria-hidden', 'true');
  el.prepend(light, edge);
  el.classList.add('rb-spotlight');

  let raf = 0, px = 0, py = 0;
  const flush = () => {
    raf = 0;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--rb-sp-x', (px - r.left).toFixed(1) + 'px');
    el.style.setProperty('--rb-sp-y', (py - r.top).toFixed(1) + 'px');
  };
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(flush);
  };
  const enter = (e) => {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    flush();                                  // первая позиция сразу, чтобы блик не «выезжал» из угла
    el.classList.add('rb-sp-on');
  };
  const leave = () => { el.classList.remove('rb-sp-on'); if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  const hide = () => { if (document.hidden) leave(); };

  el.addEventListener('pointerenter', enter);
  el.addEventListener('pointermove', move, { passive: true });
  el.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', hide);
  const api = {
    destroy() {
      leave();
      el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', hide);
      light.remove(); edge.remove(); el.classList.remove('rb-spotlight'); delete el.__rbSpotlight;
    },
  };
  el.__rbSpotlight = api;
  return api;
}
