// Based on React Bits PulseHeart (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// Сердечко `.heart`: по клику сжимается в точку (40% времени), меняет вид, потом возвращается с перелётом.
// Класс `on` по-прежнему ставит popup.js; здесь только движение. В покое ничего не работает.
//   initPulseHeart(root = document)   // один раз; делегирует `click` на root, переживает перерисовку списка

const DURATION = 560, OUT = 0.4, DOT = 0.3, OVERSHOOT = 1.7;
const back = (k, c) => { const u = k - 1; return 1 + (c + 1) * u ** 3 + c * u ** 2; };
const swell = (t) => (t <= 0 ? 0 : t < OUT ? 1 - (1 - t / OUT) ** 3 : 1 - back((t - OUT) / (1 - OUT), OVERSHOOT));
const FRAMES = Array.from({ length: 29 }, (_, i) => {
  const t = i / 28;
  return { offset: t, scale: +(1 - (1 - DOT) * swell(t)).toFixed(4) };
});

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  || document.documentElement.classList.contains('no-anim') || document.hidden;

export function initPulseHeart(root = document) {
  if (root.__rbHeart) return;
  root.__rbHeart = true;
  root.addEventListener('click', (e) => {
    const heart = e.target.closest?.('.heart');
    if (!heart || still()) return;
    const svg = heart.querySelector('svg');
    if (!svg) return;
    heart.__rbAnim?.cancel();
    heart.dataset.rbRun = '';
    const anim = heart.__rbAnim = svg.animate(FRAMES.map((f) => ({ offset: f.offset, scale: String(f.scale), easing: 'linear' })), { duration: DURATION });
    anim.onfinish = () => { if (heart.__rbAnim === anim) { delete heart.dataset.rbRun; heart.__rbAnim = null; } };
  });
}
