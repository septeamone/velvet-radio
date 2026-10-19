/* Based on React Bits CheckMark (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
   Маленький индикатор рядом с заголовком «Проверка станций». Состояния берём только из DOM, который ведёт popup.js:
   кнопка #bcheck disabled -> проверка идёт (вращающаяся дуга); в #badlist есть строки -> есть не отвечающие («!»);
   в #checkInfo есть число проверенных станций (sChecked/sAllOk), список пуст -> всё работает (галочка); иначе простой (кольцо). */

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

/** initCheckMark(settingsEl) -> { destroy } */
export function initCheckMark(settingsEl) {
  const btn = settingsEl.querySelector('#bcheck'), info = settingsEl.querySelector('#checkInfo'), bad = settingsEl.querySelector('#badlist');
  const st = info?.closest('.st');
  if (!btn || !info || !bad || !st) return;

  const mark = document.createElement('span');
  mark.className = 'rb-cm'; mark.setAttribute('role', 'img');
  const svg = el('svg', { viewBox: '0 0 24 24', class: 'rb-cm-svg', 'aria-hidden': 'true' });
  const spin = el('g', { class: 'rb-cm-spin' });
  spin.append(el('circle', { class: 'rb-cm-ring', cx: 12, cy: 12, r: 8.5, pathLength: 100, transform: 'rotate(-90 12 12)' }));
  svg.append(
    el('circle', { class: 'rb-cm-track', cx: 12, cy: 12, r: 8.5 }), spin,
    el('path', { class: 'rb-cm-check', d: 'M8 12.4 10.8 15.2 16.2 9.2', pathLength: 1 }),
    el('path', { class: 'rb-cm-bang', d: 'M12 7.6v5M12 16.2v.2', pathLength: 1 }),
  );
  mark.append(svg);
  const head = document.createElement('div');
  head.className = 'rb-cm-head';
  st.before(head); head.append(mark, st);

  const sync = () => {
    const mode = btn.disabled ? 'run' : bad.children.length ? 'bad' : /\d/.test(info.textContent) ? 'ok' : 'off';
    if (mark.dataset.rb !== mode) mark.dataset.rb = mode;
    const quiet = mode === 'off' || mode === 'run';
    if (quiet) mark.removeAttribute('aria-label'); else mark.setAttribute('aria-label', info.textContent);
    mark.toggleAttribute('aria-hidden', quiet);
  };
  const mo = new MutationObserver(sync);
  mo.observe(btn, { attributes: true, attributeFilter: ['disabled'] });
  mo.observe(info, { childList: true, characterData: true, subtree: true });
  mo.observe(bad, { childList: true });
  const vis = () => mark.classList.toggle('rb-cm-paused', document.hidden);
  document.addEventListener('visibilitychange', vis);
  sync(); vis();

  return { destroy() { mo.disconnect(); document.removeEventListener('visibilitychange', vis); head.before(st); head.remove(); } };
}
