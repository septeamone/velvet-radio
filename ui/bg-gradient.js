/* Inspired by React Bits Grainient / Silk (MIT + Commons Clause, © David Haz), ported to plain JS/CSS without WebGL.
   Подложка окна: слой со статичными мягкими градиентами; движется только transform (композитинг на GPU), и только пока играет станция
   (.player.on) и окно видно. В покое и при reduced-motion/no-anim показывается статичная версия. Зерно (.bg) остаётся поверх. */

/** initBgGradient(bgEl, playerEl) -> { destroy } */
export function initBgGradient(bgEl, playerEl) {
  if (!bgEl || !playerEl) return;
  const wrap = document.createElement('div');
  wrap.className = 'rb-bg';
  wrap.setAttribute('aria-hidden', 'true');
  const layer = document.createElement('i');
  layer.className = 'rb-bg-layer';
  wrap.append(layer);
  bgEl.before(wrap);
  const sync = () => wrap.classList.toggle('rb-bg-run', playerEl.classList.contains('on') && !document.hidden);
  const mo = new MutationObserver(sync);
  mo.observe(playerEl, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  sync();
  return { destroy() { mo.disconnect(); document.removeEventListener('visibilitychange', sync); wrap.remove(); } };
}
