/* Based on React Bits BlurText (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
 *
 * Название станции в плеере проявляется из размытия, один раз и только при реальной смене текста.
 *   initBlurText(document.querySelector('#nowTitle'));
 * popup.js по-прежнему вызывает setMq(): внутри элемента стоит .mq с обычным текстом. Модуль следит за ним через MutationObserver,
 * и если текст изменился, на время анимации разбивает его на слова (у одного слова — на буквы) и играет WAAPI; в конце возвращает
 * обычный текст. Ширина не меняется, поэтому бегущая строка (measureMq) продолжает работать как раньше. Постоянных циклов нет.
 */
export function initBlurText(el, opts = {}) {
  const o = { stepMs: 45, maxStepMs: 420, durMs: 520, blur: 8, dy: 7, ...opts };
  const html = document.documentElement;
  const mqReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const born = performance.now();
  let last = null, running = null;

  const allowed = () => !document.hidden && !html.classList.contains('no-anim') && !mqReduce?.matches;

  const finish = (inner, text) => {
    running = null;
    if (inner.isConnected && inner.childElementCount) inner.textContent = text;
  };

  const play = (inner, text) => {
    const parts = text.split(/(\s+)/);
    const words = parts.filter((p) => p && !/^\s+$/.test(p));
    const letters = words.length === 1;
    const frag = document.createDocumentFragment();
    const pieces = [];
    const mk = (s) => { const n = document.createElement('span'); n.className = 'rb-blur-p'; n.textContent = s; pieces.push(n); return n; };
    for (const p of parts) {
      if (!p) continue;
      if (/^\s+$/.test(p)) frag.append(p);
      else if (letters) for (const ch of p) frag.append(mk(ch));
      else frag.append(mk(p));
    }
    inner.replaceChildren(frag);
    const step = Math.min(o.stepMs, o.maxStepMs / Math.max(1, pieces.length - 1));
    const anims = pieces.map((n, i) => n.animate(
      [
        { opacity: 0, filter: `blur(${o.blur}px)`, transform: `translateY(${o.dy}px)` },
        { opacity: 0.6, filter: `blur(${o.blur / 3}px)`, transform: `translateY(${-o.dy / 4}px)`, offset: 0.55 },
        { opacity: 1, filter: 'blur(0)', transform: 'none' },
      ],
      { duration: o.durMs, delay: i * step, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
    ));
    const token = running = {};
    Promise.all(anims.map((a) => a.finished)).then(() => { if (running === token) finish(inner, text); }, () => {});
  };

  const sync = () => {
    const inner = el.firstElementChild;
    const text = (inner ?? el).textContent;
    if (text === last) return;
    last = text;
    if (!inner?.classList.contains('mq') || !text.trim()) return;
    if (performance.now() - born < 500) return;                    // первая отрисовка окна: без показа
    if (allowed()) play(inner, text);
  };

  el.classList.add('rb-blur-host');
  const mo = new MutationObserver(sync);
  mo.observe(el, { childList: true, subtree: true, characterData: true });
  sync();
  return { destroy() { mo.disconnect(); el.classList.remove('rb-blur-host'); } };
}
