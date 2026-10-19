/* Based on React Bits ShinyText (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
   Перелив света по тексту, пока у плеера класс `loading` (идёт подключение). В покое никакой анимации и никакого JS-цикла: анимацию ведёт CSS. */

/** shinyText(target, { player = target.closest('.player') }) -> { destroy }
 *  target: элемент с текстом (#nowSub). Класс `rb-shiny` ставится на него, пока player.loading. */
export function shinyText(target, { player = target.closest('.player') } = {}) {
  const sync = () => target.classList.toggle('rb-shiny', !!player?.classList.contains('loading'));
  const mo = new MutationObserver(sync);
  mo.observe(player, { attributes: true, attributeFilter: ['class'] });
  const vis = () => target.classList.toggle('rb-shiny-paused', document.hidden);
  document.addEventListener('visibilitychange', vis);
  sync(); vis();
  return { destroy() { mo.disconnect(); document.removeEventListener('visibilitychange', vis); target.classList.remove('rb-shiny', 'rb-shiny-paused'); } };
}
