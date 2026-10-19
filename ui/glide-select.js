// Based on React Bits GlideSelect (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
//
// Слой оформления и поведения для существующих #gbtn (кнопка) и #gpanel (панель с кнопками .chip).
// Логику выбора жанра по-прежнему ведёт popup.js: он переключает panel.hidden и пересоздаёт чипы при каждом открытии.
// Здесь: меню «выпрыгивает» из угла кнопки (CSS, только переменная --rb-gs-ox), подсветка (рамка-«пилюля») плавно
// скользит между чипами (CSS-переменные на панели + ::after), клавиатура: стрелки (в том числе вверх/вниз по строкам),
// Home/End, Esc, Tab. Слушатели только на кнопке и панели (делегирование), чипы не трогаем.

export function initGlideSelect({ button, panel }) {
  let kbOpen = false, live = false, snapRaf = 0;
  const chips = () => [...panel.querySelectorAll('.chip')];
  const chipOf = (el) => el?.closest?.('.chip') ?? null;

  button.setAttribute('aria-haspopup', 'true');
  if (panel.id) button.setAttribute('aria-controls', panel.id);
  button.setAttribute('aria-expanded', String(!panel.hidden));

  /* ---------- подсветка, скользящая между чипами ---------- */
  function setActive(chip) {
    if (!chip || !chip.isConnected || panel.hidden) { live = false; delete panel.dataset.rbGsLive; return; }
    if (!live) {                                        // первое появление: сразу на месте, без «полёта» из прошлой позиции
      panel.dataset.rbGsSnap = '';
      cancelAnimationFrame(snapRaf);
      snapRaf = requestAnimationFrame(() => { delete panel.dataset.rbGsSnap; });
    }
    const s = panel.style;
    s.setProperty('--rb-gs-x', `${chip.offsetLeft}px`);
    s.setProperty('--rb-gs-y', `${chip.offsetTop}px`);
    s.setProperty('--rb-gs-w', `${chip.offsetWidth}px`);
    s.setProperty('--rb-gs-h', `${chip.offsetHeight}px`);
    panel.dataset.rbGsLive = '';
    live = true;
  }

  panel.addEventListener('pointerover', (e) => { if (e.pointerType !== 'touch') setActive(chipOf(e.target)); });
  panel.addEventListener('pointerleave', () => setActive(panel.contains(document.activeElement) ? chipOf(document.activeElement) : null));
  panel.addEventListener('focusin', (e) => setActive(chipOf(e.target)));
  panel.addEventListener('focusout', (e) => {
    const to = e.relatedTarget;
    if (!to) return;
    if (!panel.contains(to) && to !== button) panel.hidden = true;   // Tab ушёл за пределы панели
    else if (!panel.contains(to)) setActive(null);
  });

  /* ---------- открытие/закрытие: popup.js меняет hidden и пересоздаёт чипы, мы синхронизируем ARIA и подсветку ---------- */
  // Точка «выпрыгивания» считается до открытия (панель ещё скрыта), чтобы анимация стартовала уже с верным центром.
  button.addEventListener('click', (e) => {
    kbOpen = e.detail === 0;
    if (!panel.hidden) return;
    const b = button.getBoundingClientRect(), host = panel.offsetParent?.getBoundingClientRect() ?? { left: 0 };
    const left = host.left + (parseFloat(getComputedStyle(panel).left) || 0);
    panel.style.setProperty('--rb-gs-ox', `${Math.round(b.left + b.width / 2 - left)}px`);
  }, true);

  const sync = () => {
    button.setAttribute('aria-expanded', String(!panel.hidden));
    if (panel.hidden) {
      setActive(null);
      if (panel.contains(document.activeElement)) button.focus({ preventScroll: true });
      return;
    }
    panel.setAttribute('aria-label', button.getAttribute('aria-label') ?? '');
    for (const c of chips()) c.setAttribute('aria-pressed', String(c.classList.contains('on')));
    if (kbOpen) { (panel.querySelector('.chip.on') ?? chips()[0])?.focus(); kbOpen = false; }
    else setActive(null);
  };
  new MutationObserver(() => sync()).observe(panel, { attributes: true, attributeFilter: ['hidden'], childList: true });

  /* ---------- клавиатура ---------- */
  function neighbour(cur, dir) {                        // чипы в несколько строк: вверх/вниз ищем ближайший по горизонтали в соседней строке
    const all = chips();
    const rows = [...new Set(all.map((c) => c.offsetTop))].sort((a, b) => a - b);
    const ri = rows.indexOf(cur.offsetTop) + dir;
    if (ri < 0 || ri >= rows.length) return null;
    const mid = (c) => c.offsetLeft + c.offsetWidth / 2, cx = mid(cur);
    return all.filter((c) => c.offsetTop === rows[ri]).sort((a, b) => Math.abs(mid(a) - cx) - Math.abs(mid(b) - cx))[0];
  }
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); panel.hidden = true; button.focus({ preventScroll: true }); return; }
    const all = chips(), cur = chipOf(document.activeElement), i = all.indexOf(cur);
    if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    let next;
    if (e.key === 'ArrowRight') next = all[Math.min(i + 1, all.length - 1)];
    else if (e.key === 'ArrowLeft') next = all[Math.max(i - 1, 0)];
    else if (e.key === 'ArrowDown') next = neighbour(cur, 1) ?? cur;
    else if (e.key === 'ArrowUp') next = neighbour(cur, -1) ?? cur;
    else if (e.key === 'Home') next = all[0];
    else if (e.key === 'End') next = all[all.length - 1];
    else return;
    e.preventDefault();
    next.focus();
  });
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); e.stopPropagation(); panel.hidden = true; return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (panel.hidden) button.click();                  // click без указателя (detail 0): панель откроется и фокус уйдёт на выбранный чип
    else (panel.querySelector('.chip.on') ?? chips()[0])?.focus();
  });
}
