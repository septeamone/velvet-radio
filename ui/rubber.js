// Based on React Bits RubberSegment (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// Резиновый ползунок для сегментных переключателей (.tabs, .vtoggle, #bufseg): передний край уходит к цели,
// задний сначала тянется, потом догоняет с лёгким сжатием. Двигаются только `left`/`right` самого ползунка (WAAPI, без кадров в покое).
//   initRubber(root, thumb?)   // root: контейнер с кнопками-детьми; thumb: элемент-ползунок (по умолчанию .thumb/.vthumb/.seg-thumb внутри)
//   initRubberAll(doc?)        // подключает .tabs, .vtoggle и #bufseg (повторный вызов безопасен)
// Выбранный пункт читается из разметки: кнопка с классом `on` или кнопка, чей data-view равен root.dataset.view.
// Любое изменение class/data-* внутри root (его делает popup.js) запускает движение; ничего в popup.js менять не нужно.
// На root ставится атрибут data-rb: только тогда ui/rubber.css переопределяет старое положение ползунка.

const STRETCH_MS = 150, TOTAL_MS = 620, SQUASH = 3;
const EXPO = 'cubic-bezier(.23, 1, .32, 1)';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  || document.documentElement.classList.contains('no-anim') || document.hidden;

export function initRubber(root, thumb = root?.querySelector('.thumb, .vthumb, .seg-thumb')) {
  if (!root || !thumb || root.dataset.rb !== undefined) return;
  root.dataset.rb = '';
  const buttons = () => [...root.children].filter((b) => b.tagName === 'BUTTON');
  const selected = () => buttons().findIndex((b) => b.classList.contains('on') || (b.dataset.view && b.dataset.view === root.dataset.view));
  let at = selected(), anims = [];

  const edges = (i) => {                                         // границы кнопки i в координатах root (px): [левая, правая]
    const b = buttons()[i];
    return b ? [b.offsetLeft, b.offsetLeft + b.offsetWidth] : [0, 0];
  };
  const put = (l, r) => { thumb.style.left = `${l}px`; thumb.style.right = `${root.clientWidth - r}px`; };
  const stop = () => { anims.forEach((a) => a.cancel()); anims = []; };
  const jump = () => { stop(); if (at >= 0) put(...edges(at)); };

  function travel(to) {
    const [bl, br] = edges(to);
    if (still() || !root.offsetWidth || !thumb.offsetWidth) { at = to; return jump(); }
    const rr = root.getBoundingClientRect(), tr = thumb.getBoundingClientRect();
    const scale = rr.width / root.offsetWidth || 1;                // на случай масштаба страницы
    const cl = (tr.left - rr.left) / scale - root.clientLeft, cr = (tr.right - rr.left) / scale - root.clientLeft;
    stop();
    put(bl, br);                                                    // итоговое значение лежит в стиле, анимации лишь «ведут» к нему
    const dir = Math.sign((bl + br) / 2 - (cl + cr) / 2) || 1;
    const W = root.clientWidth;
    const px = (prop, v) => (prop === 'left' ? `${v}px` : `${W - v}px`);
    const lead = dir > 0 ? 'right' : 'left', trail = dir > 0 ? 'left' : 'right';
    const cur = { left: cl, right: cr }, end = { left: bl, right: br };
    const run = (prop, frames) => thumb.animate(
      frames.map(([v, offset, easing]) => ({ [prop]: px(prop, v), offset, easing: easing ?? 'linear' })),
      { duration: TOTAL_MS });
    const k = STRETCH_MS / TOTAL_MS;
    anims = [
      run(lead, [[cur[lead], 0, EXPO], [end[lead], 0.34, 'linear'], [end[lead], 1]]),
      run(trail, [[cur[trail], 0, 'linear'], [cur[trail], k, EXPO], [end[trail] + dir * SQUASH, 0.72, 'ease-out'], [end[trail], 1]]),
    ];
    at = to;
  }

  const sync = () => { const i = selected(); if (i >= 0 && i !== at) travel(i); };
  new MutationObserver(sync).observe(root, { attributes: true, subtree: true, attributeFilter: ['class', 'data-view', 'data-tab'] });
  const settle = () => { const i = selected(); if (i >= 0) at = i; jump(); };
  new ResizeObserver(settle).observe(root);                         // первое измерение, смена размера, показ скрытой панели
  document.fonts?.ready.then(settle);
}

export function initRubberAll(doc = document) {
  doc.querySelectorAll('.tabs, .vtoggle, #bufseg').forEach((el) => initRubber(el));
}
