// Based on React Bits SquishSwitch (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// Настоящие чекбоксы `input.sw`: при `change` ползунок вытягивается от скорости и сплющивается о край.
// Событие change и свойство checked не трогаются, popup.js работает как раньше. Программная смена checked (syncSettingsUI) идёт без анимации.
//   initSquish(root = document)   // один раз; делегирует `change` на root

const MS = 560, ZETA = 0.52, W0 = 15, N = 28;
const SAMPLES = (() => {                                         // x(t) пружины 0..1 с лёгким перелётом; скорость и перелёт задают форму
  const wd = W0 * Math.sqrt(1 - ZETA * ZETA);
  const x = (t) => 1 - Math.exp(-ZETA * W0 * t) * (Math.cos(wd * t) + (ZETA * W0 / wd) * Math.sin(wd * t));
  const xs = Array.from({ length: N + 1 }, (_, i) => x(i / N));
  const v = xs.map((_, i) => ((xs[Math.min(N, i + 1)] - xs[Math.max(0, i - 1)]) * N) / 2);
  const vmax = Math.max(...v.map(Math.abs)), omax = Math.max(0.0001, ...xs.map((p) => p - 1));
  return xs.map((p, i) => ({ t: i / N, x: p, v: Math.abs(v[i]) / vmax, over: Math.max(0, p - 1) / omax }));
})();

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  || document.documentElement.classList.contains('no-anim') || document.hidden;

export function initSquish(root = document) {
  if (root.__rbSquish) return;
  root.__rbSquish = true;
  root.querySelectorAll('input.sw').forEach((el) => { el.dataset.sq = ''; });
  root.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.matches?.('input.sw')) return;
    el.dataset.sq = '';
    if (still()) return;
    const cs = getComputedStyle(el, '::after');
    const travel = el.clientWidth - 2 * parseFloat(cs.left) - parseFloat(cs.width);
    let from = el.checked ? 0 : travel;
    if (el.__rbAnim) { from = new DOMMatrix(cs.transform).m41; el.__rbAnim.cancel(); }
    const to = el.checked ? travel : 0;
    const frames = SAMPLES.map((s) => ({
      offset: s.t,
      transform: `translateX(${(from + (to - from) * s.x).toFixed(2)}px) scale(${(1 + 0.42 * s.v - 0.28 * s.over).toFixed(3)}, ${(1 - 0.18 * s.v + 0.2 * s.over).toFixed(3)})`,
    }));
    const anim = el.__rbAnim = el.animate(frames, { duration: MS, easing: 'linear', pseudoElement: '::after' });
    anim.onfinish = () => { if (el.__rbAnim === anim) el.__rbAnim = null; };
  });
}
