/* Based on React Bits ElasticSlider (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
   Настоящий <input type=range> остаётся (клавиатура, события input/change, ARIA); поверх рисуется резиновая дорожка.
   Без requestAnimationFrame: рост и «отскок» делает CSS, растяжение у краёв считается только на событиях указателя. */

const rubber = (d, limit) => 2 * (1 / (1 + Math.exp(-d / limit)) - 0.5) * limit;
const still = () => document.documentElement.classList.contains('no-anim') || matchMedia('(prefers-reduced-motion: reduce)').matches;

/** elasticSlider(input, { icon?, maxStretch = 36 }) -> { sync, destroy }
 *  input: <input type=range>; icon: необязательный элемент рядом (значок динамика), он смещается вместе с растяжением. */
export function elasticSlider(input, { icon = null, maxStretch = 36 } = {}) {
  const wrap = document.createElement('span');
  wrap.className = 'rb-elastic-wrap';
  const track = document.createElement('span');
  track.className = 'rb-elastic-track';
  track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'rb-elastic-fill';
  track.append(fill);
  input.before(wrap);
  wrap.append(input, track);
  input.classList.add('rb-elastic-input');
  const host = wrap.parentElement;
  host?.classList.add('rb-elastic-host');
  // правая иконка «громче»: динамик с волнами (рисуем сами); левая — переданная иконка «тише»
  const mk = (tag, a) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in a) n.setAttribute(k, a[k]); return n; };
  const loud = mk('svg', { viewBox: '0 0 24 24', class: 'rb-elastic-loud', 'aria-hidden': 'true' });
  loud.append(mk('path', { d: 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z' }), mk('path', { class: 'w1', d: 'M15.2 9.4a3.8 3.8 0 0 1 0 5.2' }), mk('path', { class: 'w2', d: 'M17.9 6.8a7.5 7.5 0 0 1 0 10.4' }));
  wrap.after(loud);
  if (icon) icon.classList.add('rb-elastic-quiet');
  const icons = [icon, loud];

  const sync = () => {
    const min = +input.min || 0, max = +input.max || 1;
    const v = (+input.value - min) / (max - min);
    wrap.style.setProperty('--rb-p', `${v * 100}%`);
    host?.style.setProperty('--rb-v', v.toFixed(3));
    host?.classList.toggle('rb-elastic-min', v <= 0.001);
  };
  sync();
  const mo = new MutationObserver(sync);
  mo.observe(input, { attributes: true, attributeFilter: ['style', 'value'] });
  input.addEventListener('input', sync);

  let width = 1, pressed = false;
  const setSide = (side) => { track.style.transformOrigin = side > 0 ? '0% 50%' : '100% 50%'; };
  const pulse = (side) => (side < 0 ? icon : loud)?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
  let overSide = 0;
  // сторона растяжения: соответствующая иконка уезжает наружу и чуть растёт
  const shift = (side, s) => {
    if (icon) icon.style.transform = side < 0 ? `translateX(${-s}px) scale(1.12)` : '';
    loud.style.transform = side > 0 ? `translateX(${s}px) scale(1.12)` : '';
  };

  const down = (e) => {
    if (e.button !== 0) return;
    pressed = true; overSide = 0;
    width = input.getBoundingClientRect().width || 1;
    wrap.dataset.drag = '';
    wrap.classList.remove('rb-elastic-snap'); host?.classList.remove('rb-elastic-snap');
  };
  const move = (e) => {
    if (!pressed || still()) return;
    const r = input.getBoundingClientRect();
    const over = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0;
    if (!over) { if (overSide) { overSide = 0; track.style.transform = ''; shift(0, 0); } return; }
    const side = e.clientX < r.left ? -1 : 1;
    if (side !== overSide) { overSide = side; shift(0, 0); pulse(side); }
    const s = rubber(over, maxStretch);
    setSide(side);
    track.style.transform = `scale(${1 + s / width}, ${1 - 0.22 * Math.min(1, s / maxStretch)})`;
    shift(side, s);
  };
  const up = () => {
    if (!pressed) return;
    pressed = false; overSide = 0;
    delete wrap.dataset.drag;
    if (track.style.transform || icon?.style.transform || loud.style.transform) {
      wrap.classList.add('rb-elastic-snap'); host?.classList.add('rb-elastic-snap');
      track.style.transform = ''; shift(0, 0);
      setTimeout(() => { wrap.classList.remove('rb-elastic-snap'); host?.classList.remove('rb-elastic-snap'); }, 700);
    }
  };
  input.addEventListener('pointerdown', down);
  input.addEventListener('pointermove', move);
  input.addEventListener('pointerup', up);
  input.addEventListener('pointercancel', up);
  input.addEventListener('lostpointercapture', up);

  // клавиатура у границы: короткий толчок
  const bumpKeys = { ArrowRight: 1, ArrowUp: 1, PageUp: 1, End: 1, ArrowLeft: -1, ArrowDown: -1, PageDown: -1, Home: -1 };
  input.addEventListener('keydown', (e) => {
    const side = bumpKeys[e.key];
    if (!side || still()) return;
    const atEdge = side > 0 ? +input.value >= +input.max : +input.value <= +input.min;
    if (!atEdge) return;
    width = input.getBoundingClientRect().width || 1;
    setSide(side);
    track.animate([{ transform: 'none' }, { transform: `scale(${1 + 12 / width}, .88)` }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    pulse(side);
  });

  return {
    sync,
    destroy() {
      mo.disconnect();
      input.removeEventListener('input', sync);
      input.removeEventListener('pointerdown', down);
      input.removeEventListener('pointermove', move);
      input.removeEventListener('pointerup', up);
      input.removeEventListener('pointercancel', up);
      input.removeEventListener('lostpointercapture', up);
      input.classList.remove('rb-elastic-input');
      loud.remove(); icon?.classList.remove('rb-elastic-quiet'); host?.classList.remove('rb-elastic-host', 'rb-elastic-min');
      wrap.replaceWith(input);
    },
  };
}
