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

  const sync = () => {
    const min = +input.min || 0, max = +input.max || 1;
    wrap.style.setProperty('--rb-p', `${((+input.value - min) / (max - min)) * 100}%`);
  };
  sync();
  const mo = new MutationObserver(sync);
  mo.observe(input, { attributes: true, attributeFilter: ['style', 'value'] });
  input.addEventListener('input', sync);

  let width = 1, pressed = false;
  const setSide = (side) => { track.style.transformOrigin = side > 0 ? '0% 50%' : '100% 50%'; };
  const pulse = () => icon?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
  let overSide = 0;

  const down = (e) => {
    if (e.button !== 0) return;
    pressed = true; overSide = 0;
    width = input.getBoundingClientRect().width || 1;
    wrap.dataset.drag = '';
    wrap.classList.remove('rb-elastic-snap');
  };
  const move = (e) => {
    if (!pressed || still()) return;
    const r = input.getBoundingClientRect();
    const over = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0;
    if (!over) { if (overSide) { overSide = 0; track.style.transform = ''; if (icon) icon.style.transform = ''; } return; }
    const side = e.clientX < r.left ? -1 : 1;
    if (side !== overSide) { overSide = side; pulse(); }
    const s = rubber(over, maxStretch);
    setSide(side);
    track.style.transform = `scale(${1 + s / width}, ${1 - 0.22 * Math.min(1, s / maxStretch)})`;
    if (icon) icon.style.transform = side < 0 ? `translateX(${-s}px)` : '';
  };
  const up = () => {
    if (!pressed) return;
    pressed = false; overSide = 0;
    delete wrap.dataset.drag;
    if (track.style.transform || icon?.style.transform) {
      wrap.classList.add('rb-elastic-snap');
      track.style.transform = ''; if (icon) icon.style.transform = '';
      setTimeout(() => wrap.classList.remove('rb-elastic-snap'), 700);
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
    pulse();
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
      wrap.replaceWith(input);
    },
  };
}
