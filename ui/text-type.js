// Based on React Bits TextType (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
//
// В пустом поле поиска, пока оно не в фокусе, в placeholder "печатаются" и стираются названия станций (или стран)
// из текущего списка окна. Ничего не выдумывается: нет строк в списке, остаётся обычный placeholder.
// Исходный placeholder ставит popup.js (вкладка/язык): мы следим за атрибутом и каждый раз запоминаем его заново,
// отличая свои записи от чужих. Без rAF: один setTimeout за раз; пока не активно (фокус, текст, окно скрыто,
// reduced-motion / no-anim) таймеров нет, и placeholder исходный.
const TYPE = 70, ERASE = 32, HOLD = 1700, GAP = 450, START = 1800, MAX = 5;

export function initTextType(input) {
  const html = document.documentElement;
  const list = document.getElementById('list');
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let orig = input.getAttribute('placeholder') ?? '', mine = null;   // mine: что записали мы сами
  let timer = 0, run = 0, names = [], at = 0, pos = 0;

  const allowed = () => !document.hidden && document.activeElement !== input && !input.value
    && !mq?.matches && !html.classList.contains('no-anim');
  const write = (s) => { mine = s; input.setAttribute('placeholder', s); };
  const sample = () => {
    const seen = new Set();
    for (const el of list?.querySelectorAll('.row .name, .crow .cn') ?? []) {
      const s = el.textContent.trim();
      if (s) seen.add(s);
      if (seen.size >= MAX) break;
    }
    return [...seen];
  };

  function stop() {
    clearTimeout(timer); timer = 0; run++;
    if (mine !== null) { mine = null; input.setAttribute('placeholder', orig); }
  }
  function later(fn, ms) { const id = run; timer = setTimeout(() => { if (id === run) fn(); }, ms); }

  function begin() {
    if (!allowed()) return;
    names = sample();
    if (!names.length) { later(begin, START); return; }               // списка ещё нет: проверим позже
    at = at % names.length; pos = 0;
    later(typing, TYPE);
  }
  function typing() {
    if (!allowed()) return stop();
    const s = names[at];
    pos++;
    write(s.slice(0, pos) + '|');
    if (pos < s.length) later(typing, TYPE + (s[pos - 1] === ' ' ? 40 : 0));
    else later(erasing, HOLD);
  }
  function erasing() {
    if (!allowed()) return stop();
    const s = names[at];
    pos--;
    write(pos > 0 ? s.slice(0, pos) + '|' : '|');
    if (pos > 0) later(erasing, ERASE);
    else { at++; later(begin, GAP); }
  }
  function kick() { stop(); if (allowed()) later(begin, START); }

  new MutationObserver(() => {
    const v = input.getAttribute('placeholder') ?? '';
    if (v === mine) return;                                          // своя запись
    orig = v;                                                        // popup.js сменил placeholder (вкладка/язык)
    if (timer || mine !== null) { stop(); if (allowed()) later(begin, START); }
  }).observe(input, { attributes: true, attributeFilter: ['placeholder'] });

  input.addEventListener('focus', stop);
  input.addEventListener('blur', kick);
  input.addEventListener('input', () => { if (input.value) stop(); else kick(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else kick(); });
  mq?.addEventListener?.('change', kick);
  kick();
  return { stop };
}
