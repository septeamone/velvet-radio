/* Based on React Bits StatusMark (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
   Значок состояния потока на логотипе плеера. Состояния берутся только из того, что уже знает popup.js:
   off (остановлено) -> пунктирное кольцо простоя; run (подключение) -> вращающаяся дуга; ok (играет) -> галочка;
   warn (играет, но резервный поток/понижение качества) -> кольцо с «!»; bad (станция недоступна) -> крестик. */

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

/** statusMark(dot, { player = dot.closest('.player') }) -> { destroy }
 *  dot: #dot (у него popup.js ставит data-st=ok|warn|bad|off); подключение определяется по классу `loading` у player.
 *  Модуль пишет на dot атрибут data-rb (off|run|warn|ok|bad) и рисует внутри svg. */
export function statusMark(dot, { player = dot.closest('.player') } = {}) {
  const wrap = dot.closest('.logo-wrap');
  const svg = el('svg', { viewBox: '0 0 24 24', class: 'rb-sm-svg', 'aria-hidden': 'true' });
  const spin = el('g', { class: 'rb-sm-spin' });
  spin.append(el('circle', { class: 'rb-sm-ring', cx: 12, cy: 12, r: 8.5, pathLength: 100, transform: 'rotate(-90 12 12)' }));
  svg.append(
    el('circle', { class: 'rb-sm-track', cx: 12, cy: 12, r: 8.5 }), spin,
    el('path', { class: 'rb-sm-check', d: 'M8 12.4 10.8 15.2 16.2 9.2', pathLength: 1 }),
    el('path', { class: 'rb-sm-cross', d: 'M9 9 15 15M15 9 9 15', pathLength: 1 }),
    el('path', { class: 'rb-sm-bang', d: 'M12 7.6v5M12 16.2v.2', pathLength: 1 }),
  );
  dot.replaceChildren(svg);
  dot.classList.add('rb-sm');
  dot.setAttribute('role', 'img');

  const sync = () => {
    const st = dot.dataset.st;
    const loading = !!player?.classList.contains('loading');
    const mode = st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : st === 'warn' ? (loading ? 'run' : 'warn') : 'off';
    if (dot.dataset.rb !== mode) dot.dataset.rb = mode;
    const label = mode === 'off' ? '' : wrap?.title ?? '';
    if (label) { dot.setAttribute('aria-label', label); dot.removeAttribute('aria-hidden'); }
    else { dot.removeAttribute('aria-label'); dot.setAttribute('aria-hidden', 'true'); }
  };
  const mo = new MutationObserver(sync);
  mo.observe(dot, { attributes: true, attributeFilter: ['data-st'] });
  if (player) mo.observe(player, { attributes: true, attributeFilter: ['class'] });
  if (wrap) mo.observe(wrap, { attributes: true, attributeFilter: ['title'] });
  const vis = () => dot.classList.toggle('rb-sm-paused', document.hidden);
  document.addEventListener('visibilitychange', vis);
  sync(); vis();

  return { destroy() { mo.disconnect(); document.removeEventListener('visibilitychange', vis); dot.replaceChildren(); dot.classList.remove('rb-sm', 'rb-sm-paused'); delete dot.dataset.rb; } };
}
