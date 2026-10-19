// Based on React Bits DecryptedText (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
//
// Пустые состояния списка (.empty, их создаёт popup.js): при появлении текст один раз "собирается" слева направо
// из случайных символов того же алфавита, затем остаётся обычным текстом. Список пересобирается целиком,
// поэтому один MutationObserver на #list. Без rAF: один setInterval на время сборки (около 0,6 с).
// Высота строки фиксируется на время сборки, чтобы список не прыгал. Reduced-motion / no-anim / скрытое окно: сразу текст.
const TICK = 32, MAX_TICKS = 20;

export function initDecryptedText(list) {
  const html = document.documentElement;
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  function play(el) {
    const text = el.textContent;
    if (!text.trim() || el.dataset.rbDt !== undefined) return;
    el.dataset.rbDt = '';
    if (document.hidden || mq?.matches || html.classList.contains('no-anim')) return;
    const alphabet = [...new Set(text.replace(/\s/g, ''))];
    if (alphabet.length < 2) return;
    const chars = [...text], n = chars.length, step = Math.max(1, Math.ceil(n / MAX_TICKS));
    el.style.minHeight = el.offsetHeight + 'px';
    el.setAttribute('aria-label', text);
    const done = document.createTextNode(''), enc = document.createElement('span');
    enc.className = 'rb-dt-enc'; enc.setAttribute('aria-hidden', 'true');
    el.replaceChildren(done, enc);
    const scramble = (from) => chars.slice(from).map((c) => (/\s/.test(c) ? c : alphabet[(Math.random() * alphabet.length) | 0])).join('');
    let k = 0;
    const draw = () => { done.data = chars.slice(0, k).join(''); enc.textContent = scramble(k); };
    draw();
    const id = setInterval(() => {
      k = !el.isConnected || document.hidden ? n : Math.min(n, k + step);
      if (k >= n) {
        clearInterval(id);
        el.textContent = text; el.style.minHeight = ''; el.removeAttribute('aria-label');
        return;
      }
      draw();
    }, TICK);
  }

  new MutationObserver((records) => {
    for (const r of records) for (const el of r.addedNodes) if (el.classList?.contains('empty')) play(el);
  }).observe(list, { childList: true });
  list.querySelectorAll(':scope > .empty').forEach(play);
}
