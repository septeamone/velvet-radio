// Based on React Bits AnimatedList (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
//
// Слой для существующего списка #list (строки .row, страны .crow), без слушателей на строках:
//  1) «выпрыгивание» строк при появлении делает CSS (@keyframes rb-al-pop); здесь только добавляем .ready
//     по animationend (делегирование на список), чтобы перенос узла при перетаскивании не проигрывал анимацию заново;
//  2) подсветка выбора с клавиатуры (.kbd, её ставит popup.js) — одна общая рамка, которая плавно скользит
//     от строки к строке. Рамка — ::after самого списка, позиция в CSS-переменных; она сама прокручивается вместе со списком.
// Событий и циклов в покое нет: только MutationObserver (классы строк и пересборка списка).

export function initAnimatedList(list) {
  let live = false, snapRaf = 0, last = null;
  list.dataset.rbAl = '';

  list.addEventListener('animationend', (e) => {
    if (e.animationName === 'rb-al-pop' && e.target.parentElement === list) e.target.classList.add('ready');
  });

  function sync() {
    const row = list.querySelector('.kbd');
    if (!row) { if (live) { live = false; last = null; delete list.dataset.rbAlLive; } return; }
    if (row === last && live) return;
    last = row;
    if (!live) {                                      // первое появление рамки: сразу на месте
      list.dataset.rbAlSnap = '';
      cancelAnimationFrame(snapRaf);
      snapRaf = requestAnimationFrame(() => { delete list.dataset.rbAlSnap; });
    }
    const s = list.style;
    s.setProperty('--rb-al-x', `${row.offsetLeft}px`);
    s.setProperty('--rb-al-y', `${row.offsetTop}px`);
    s.setProperty('--rb-al-w', `${row.offsetWidth}px`);
    s.setProperty('--rb-al-h', `${row.offsetHeight}px`);
    list.dataset.rbAlLive = '';
    live = true;
  }

  // Строки ниже первого экрана не анимируются (CSS), но тоже получают .ready: иначе при переносе в начало списка (drag) они «выпрыгнули» бы.
  function markRest() {
    const kids = list.children;
    for (let i = 13; i < kids.length; i++) if (!kids[i].classList.contains('ready')) kids[i].classList.add('ready');
  }

  // Классы меняются у многих строк сразу (setKbd снимает .kbd со всех): читаем итог один раз за пачку записей.
  new MutationObserver((records) => {
    if (records.some((r) => r.type === 'childList' && r.target === list)) markRest();
    sync();
  }).observe(list, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  return { sync };
}
