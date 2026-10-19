/* Based on React Bits PixelSwap (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
 *
 * Логотип станции в плеере «собирается» по пикселям при смене станции: новый логотип уже стоит на месте,
 * поверх него сетка матовых блоков, которая упруго рассыпается волной от центра. Анимация (WAAPI, ~0,5 с) идёт только на смене,
 * потом блоки удаляются, остаётся обычное изображение; постоянных циклов нет.
 *   initPixelSwap(document.querySelector('#nowLogo'));
 * popup.js меняет содержимое через setLogo() и пишет data-id; модуль следит за атрибутом data-id.
 */
export function initPixelSwap(logo, opts = {}) {
  const o = { grid: 6, waveMs: 190, durMs: 340, ...opts };
  const html = document.documentElement;
  const mqReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const born = performance.now();
  let layer = null, last = logo.dataset.id ?? null;

  const clear = () => { layer?.remove(); layer = null; };

  const play = () => {
    clear();
    const n = o.grid, c = (n - 1) / 2, max = Math.hypot(c, c) || 1;
    layer = document.createElement('i');
    layer.className = 'rb-px';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--n', n);
    const mine = layer;
    const anims = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const b = document.createElement('b');
      layer.append(b);
      const d = Math.hypot(x - c, y - c) / max;
      const jitter = ((x * 7 + y * 13) % 5) / 5 * 0.12;
      anims.push(b.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.28 }, { transform: 'scale(0)' }],
        { duration: o.durMs, delay: (d + jitter) * o.waveMs, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' },
      ));
    }
    logo.append(layer);
    Promise.all(anims.map((a) => a.finished)).then(() => { if (layer === mine) clear(); }, () => {});
  };

  const sync = () => {
    const id = logo.dataset.id ?? null;
    if (id === last) return;
    last = id;
    if (!id || performance.now() - born < 500) return;            // первая отрисовка окна: без показа
    if (document.hidden || html.classList.contains('no-anim') || mqReduce?.matches) return;
    play();
  };

  logo.classList.add('rb-px-host');
  const mo = new MutationObserver(sync);
  mo.observe(logo, { attributes: true, attributeFilter: ['data-id'] });
  return { destroy() { mo.disconnect(); clear(); logo.classList.remove('rb-px-host'); } };
}
