/* Based on React Bits CallChip (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
 *
 * Плашка ошибки потока: когда у .player появляется класс `err`, текстовый блок один раз вздрагивает,
 * а за ним проступает приглушённая красная заливка с тонкой кромкой. Дальше всё спокойно.
 *   initCallChip(document.querySelector('.player'));
 * Кнопки .retry и .report остаются настоящими кнопками, их обработчики не затронуты. Постоянных анимаций нет.
 */
export function initCallChip(player) {
  const text = player.querySelector('.now-text');
  if (!text) return { destroy() {} };
  let was = player.classList.contains('err'), timer = 0;
  text.classList.add('rb-cc');
  const sync = () => {
    const now = player.classList.contains('err');
    if (now === was) return;
    was = now;
    clearTimeout(timer);
    text.classList.remove('rb-cc-in');
    if (!now) return;
    void text.offsetWidth;                                         // перезапуск анимации
    text.classList.add('rb-cc-in');
    timer = setTimeout(() => text.classList.remove('rb-cc-in'), 800);
  };
  const mo = new MutationObserver(sync);
  mo.observe(player, { attributes: true, attributeFilter: ['class'] });
  return { destroy() { mo.disconnect(); clearTimeout(timer); text.classList.remove('rb-cc', 'rb-cc-in'); } };
}
