// Based on React Bits WarmTooltip (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
//
// Одна общая подсказка на всё окно + делегирование событий (ни одного слушателя на элемент).
// Источник текста: атрибут `title` (его выставляет popup.js многократно) или `data-wt`.
// Как избегаем двойной подсказки: `title` сразу переносится в `data-wt` (при наведении/фокусе и
// MutationObserver-ом, когда popup.js ставит title заново), поэтому системная подсказка не успевает появиться.
// Доступность: у иконок без имени ставится aria-label, а на время показа к элементу привязывается aria-describedby.
// Логика «тёплой» подсказки: первая ждёт `delay` мс, соседние в течение `warmWindow` мс открываются сразу.
// В классическом виде (data-ui != "new") модуль ничего не трогает, а ранее перенесённые title возвращаются на место.

const SEL = '[title], [data-wt]';
const GAP = 8, MARGIN = 6, GRACE = 80, OUT_MS = 130;

export function initWarmTooltip({ delay = 400, warmWindow = 300 } = {}) {
  const root = document.documentElement;
  const isNew = () => root.dataset.ui === 'new';
  let tip = null, text = null;
  let target = null, shown = false, warmUntil = 0;
  let openTimer = 0, hideTimer = 0, closeTimer = 0, watchTimer = 0;

  function ensure() {
    if (tip) return;
    tip = document.createElement('div');
    tip.className = 'rb-wt-tip';
    tip.id = 'rb-wt-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    text = document.createElement('span');
    text.className = 'rb-wt-text';
    tip.append(text);
    document.body.append(tip);
  }

  /* ---------- title -> data-wt ---------- */
  function adopt(el) {
    const t = el.getAttribute('title');
    if (t === null) return;
    el.removeAttribute('title');
    if (t) {
      el.setAttribute('data-wt', t);
      if (!el.textContent.trim() && (!el.hasAttribute('aria-label') || el.hasAttribute('data-wt-al'))) {
        el.setAttribute('aria-label', t);
        el.setAttribute('data-wt-al', '');
      }
    } else el.removeAttribute('data-wt');
    if (el === target && shown) { if (t) setText(t); else hide(true); }
  }
  const mo = new MutationObserver((records) => {
    if (!isNew()) return;
    for (const r of records) if (r.target.isConnected) adopt(r.target);
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['title'], subtree: true });

  function restore() {                                    // вернуться в классический вид: подсказки снова системные
    hide(true);
    document.querySelectorAll('[data-wt]').forEach((el) => { el.setAttribute('title', el.getAttribute('data-wt')); el.removeAttribute('data-wt'); });
  }
  new MutationObserver(() => { if (!isNew()) restore(); }).observe(root, { attributes: true, attributeFilter: ['data-ui'] });

  /* ---------- показ ---------- */
  const contentOf = (el) => { adopt(el); return el.getAttribute('data-wt'); };

  function setText(t) {
    text.textContent = t;
    text.classList.remove('rb-wt-swap');
    void text.offsetWidth;
    text.classList.add('rb-wt-swap');
  }

  function place(el) {
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const vw = root.clientWidth || innerWidth, vh = root.clientHeight || innerHeight;
    let side = r.top - GAP - h >= MARGIN ? 'top' : 'bottom';
    if (side === 'bottom' && r.bottom + GAP + h > vh - MARGIN && r.top - GAP - h >= 0) side = 'top';
    const cx = r.left + r.width / 2;
    const x = Math.min(Math.max(cx - w / 2, MARGIN), Math.max(MARGIN, vw - MARGIN - w));
    const y = side === 'top' ? r.top - GAP - h : r.bottom + GAP;
    tip.dataset.side = side;
    tip.style.setProperty('--rb-wt-ox', `${Math.min(Math.max(cx - x, 8), w - 8)}px`);
    tip.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(Math.max(MARGIN / 2, Math.min(y, vh - h - MARGIN / 2)))}px, 0)`;
  }

  function show(el) {
    const t = contentOf(el);
    if (!t) return;
    ensure();
    clearTimeout(openTimer); clearTimeout(hideTimer); clearTimeout(closeTimer);
    const warm = shown || performance.now() < warmUntil;
    if (target && target !== el) target.removeAttribute('aria-describedby');
    target = el;
    el.setAttribute('aria-describedby', tip.id);
    tip.hidden = false;
    tip.classList.remove('rb-wt-out');
    setText(t);
    if (!shown) {                                          // новое появление: позицию ставим без полёта
      tip.classList.add('rb-wt-snap');
      place(el);
      void tip.offsetWidth;
      tip.classList.remove('rb-wt-snap');
      tip.classList.toggle('rb-wt-warm', warm);            // тёплое открытие: без «выпрыгивания», только проявление
      tip.classList.remove('rb-wt-in');
      void tip.offsetWidth;
      tip.classList.add('rb-wt-in');
    } else place(el);
    shown = true;
    clearInterval(watchTimer);
    watchTimer = setInterval(() => { if (!target?.isConnected || document.hidden) hide(true); }, 250);   // только пока подсказка открыта
  }

  function hide(instant) {
    clearTimeout(openTimer); clearTimeout(hideTimer);
    if (!shown) return;
    clearInterval(watchTimer);
    target?.removeAttribute('aria-describedby');
    shown = false;
    warmUntil = performance.now() + warmWindow;
    target = null;
    if (instant) { tip.hidden = true; tip.classList.remove('rb-wt-in', 'rb-wt-out'); return; }
    tip.classList.remove('rb-wt-in');
    tip.classList.add('rb-wt-out');
    closeTimer = setTimeout(() => { if (!shown) { tip.hidden = true; tip.classList.remove('rb-wt-in', 'rb-wt-out'); } }, OUT_MS);
  }

  /* ---------- события (делегирование на document) ---------- */
  document.addEventListener('pointerover', (e) => {
    if (!isNew() || e.pointerType === 'touch' || e.buttons) return;
    const el = e.target.closest?.(SEL);
    if (!el) return;
    adopt(el);                                             // убираем системный title до того, как он успеет показаться
    if (el === target) { clearTimeout(hideTimer); return; }
    if (!el.getAttribute('data-wt')) return;
    clearTimeout(openTimer); clearTimeout(hideTimer);
    if (shown || performance.now() < warmUntil) show(el);
    else openTimer = setTimeout(() => show(el), delay);
  }, true);

  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest?.(SEL);
    if (!el || el.contains(e.relatedTarget)) return;
    clearTimeout(openTimer);
    if (el === target) { clearTimeout(hideTimer); hideTimer = setTimeout(() => hide(false), GRACE); }
  }, true);

  document.addEventListener('focusin', (e) => {          // с клавиатуры подсказка появляется сразу
    if (!isNew()) return;
    const el = e.target.closest?.(SEL);
    if (el && e.target.matches?.(':focus-visible')) show(el);
  });
  document.addEventListener('focusout', () => hide(false));
  document.addEventListener('pointerdown', () => hide(true), true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && shown) hide(true); }, true);
  document.addEventListener('scroll', () => { if (shown) hide(true); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(true); });

  return { hide: () => hide(true) };
}
