// Based on React Bits AnimatedContent (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
//
// Смена вкладок (.tabs) и вход в страну / выход (строка страны, "назад", повторный клик по "Странам"): весь контейнер
// списка мягко въезжает с направлением (на вкладку правее или вглубь: справа; левее или назад: слева). Это отдельный тихий
// слой поверх строк animated-list: двигаются только свойства translate и opacity самого #list (transform и mask не трогаем).
// Анимация WAAPI (без rAF); поиск, сердечки, смена вида и прочие перерисовки не анимируются.
const DIST = 16, DUR = 280;

export function initAnimatedContent(list, tabsEl) {
  const html = document.documentElement;
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let pending = 0, timer = 0, anim = null;

  // popup.js перерисовывает список синхронно в обработчике клика: флаг живёт до конца этого же тика
  const arm = (dir) => { pending = dir; clearTimeout(timer); timer = setTimeout(() => { pending = 0; }, 0); };

  tabsEl?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    const btns = [...tabsEl.querySelectorAll('button[data-tab]')];
    const from = btns.findIndex((x) => x.dataset.tab === tabsEl.dataset.tab), to = btns.indexOf(b);
    if (from !== to) arm(to > from ? 1 : -1);
    else if (b.dataset.tab === 'countries') arm(-1);                  // выход из страны повторным кликом
  }, true);
  list.addEventListener('click', (e) => { if (e.target.closest('.crow')) arm(1); }, true);
  document.getElementById('cback')?.addEventListener('click', () => arm(-1), true);

  new MutationObserver(() => {
    const dir = pending; pending = 0;
    if (!dir || document.hidden || mq?.matches || html.classList.contains('no-anim')) return;
    anim?.cancel();
    anim = list.animate(
      [{ translate: `${dir * DIST}px 0`, opacity: 0.35 }, { translate: '0 0', opacity: 1 }],
      { duration: DUR, easing: 'cubic-bezier(.22,.8,.3,1)' });
    anim.onfinish = anim.oncancel = () => { anim = null; };
  }).observe(list, { childList: true });
}
