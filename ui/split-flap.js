/* Based on React Bits SplitFlapText (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
 *
 * Механическое табло «щёлк-щёлк» для строки с названием песни. Анимация идёт только на смене текста,
 * потом остаётся обычный текст, поэтому бегущая строка (setMq/measureMq) и ссылка поиска продолжают работать как раньше.
 *   const flap = initSplitFlap(document.querySelector('#nowSub'));
 *   setMq($('#nowSub'), sub);               // как и раньше: обычный текст уже стоит и измерен
 *   flap.update(sub, animate);              // сразу после setMq; animate = true только когда пришла новая песня
 * Как работает: поверх строки (она position:relative; overflow:hidden) на время анимации кладётся «табло»: по плитке на каждый
 * видимый символ, ровно в позиции настоящих букв (позиции берутся из Range, поэтому работает и с пропорциональным шрифтом).
 * Настоящий текст на это время невидим и стоит на паузе (бегущая строка тоже), после анимации табло удаляется.
 * Reduced-motion, класс no-anim, спрятанное окно: без анимации (текст просто меняется).
 */
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const LAT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', CYR = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ', DIG = '0123456789';
const ENTER = 'cubic-bezier(.55,.055,.675,.19)', LEAVE = 'cubic-bezier(.215,.61,.355,1)';

// набор «мелькающих» символов: той же письменности и регистра, что и итоговая буква
function pool(ch) {
  if (/[0-9]/.test(ch)) return DIG;
  const lower = ch !== ch.toUpperCase();
  const set = /[а-яё]/i.test(ch) ? CYR : /[a-z]/i.test(ch) ? LAT : '';
  return set && lower ? set.toLowerCase() : set;
}
const pick = (s) => s.charAt((Math.random() * s.length) | 0);

export function initSplitFlap(el, opts = {}) {
  const o = { flipMs: 64, flips: 3, maxTotalMs: 950, maxTiles: 64, ...opts };
  const html = document.documentElement;
  const mqReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  el.classList.add('rb-flap-host');
  let last = el.textContent;       // что сейчас показано
  let board = null, raf = 0, tiles = [], t0 = 0, token = 0;

  function stop() {                 // убрать табло, вернуть настоящий текст
    cancelAnimationFrame(raf); raf = 0; token++;
    tiles.forEach((t) => t.anims.forEach((a) => a.cancel()));
    board?.remove(); board = null; tiles = [];
    el.classList.remove('rb-flap-busy');
  }
  // что показывает табло прямо сейчас (если прервали на полпути, новая анимация стартует с этого)
  const shown = () => tiles.length ? last.split('').map((c, i) => tiles.find((t) => t.i === i)?.cur ?? c).join('') : last;

  function mkHalf(cls, ch) {
    const h = document.createElement('i'); h.className = cls;
    const c = document.createElement('b'); c.textContent = ch; h.append(c);
    return h;
  }
  const setCh = (half, ch) => { half.firstChild.textContent = ch; };

  function build(text, from) {
    const inner = el.firstElementChild, node = inner?.firstChild;
    if (!node || node.nodeType !== 3 || node.data !== text) return null;
    const er = el.getBoundingClientRect(), W = el.clientWidth, H = el.clientHeight;
    const rg = document.createRange(), rects = [];
    for (let i = 0; i < text.length && rects.length < o.maxTiles; i++) {
      rg.setStart(node, i); rg.setEnd(node, i + 1);
      const r = rg.getBoundingClientRect();
      if (r.left - er.left >= W) break;
      rects.push({ x: r.left - er.left, w: r.width });
    }
    if (!rects.length || !H) return null;
    const b = document.createElement('span'); b.className = 'rb-flap-board'; b.setAttribute('aria-hidden', 'true');
    b.style.setProperty('--rb-flap-h', H + 'px');
    const frag = document.createDocumentFragment(), list = [];
    const stagger = clamp((o.maxTotalMs - (o.flips + 1) * o.flipMs) / rects.length, 4, 22);
    rects.forEach((r, i) => {
      const target = text[i], prev = from[i] ?? ' ';
      if (target === ' ' || r.w < 1) return;                 // пробелы не рисуем
      const tile = document.createElement('i'); tile.className = 'rb-flap-tile';
      tile.style.left = r.x.toFixed(2) + 'px'; tile.style.width = r.w.toFixed(2) + 'px';
      const top = mkHalf('rb-flap-half rb-flap-top', prev), bot = mkHalf('rb-flap-half rb-flap-bot', prev);
      tile.append(top, bot);
      const plan = { i, tile, top, bot, cur: prev, target, seq: null, step: -1, start: i * stagger, anims: [], done: prev === target };
      if (!plan.done) {
        const ps = pool(target), seq = [];
        for (let k = 0; k < o.flips && ps; k++) seq.push(pick(ps));
        seq.push(target);
        plan.seq = seq;
        plan.front = mkHalf('rb-flap-flap rb-flap-front', prev); plan.back = mkHalf('rb-flap-flap rb-flap-back', prev);
        tile.append(plan.front, plan.back);
      }
      frag.append(tile); list.push(plan);
    });
    b.append(frag); el.append(b);
    return { b, list };
  }

  function flip(p) {               // один «щелчок» плитки: верхняя створка падает вниз, нижняя поднимается
    const prev = p.cur, next = p.seq[p.step];
    setCh(p.top, next); setCh(p.bot, prev); setCh(p.front, prev); setCh(p.back, next);
    p.cur = next;
    p.tile.classList.add('is-flip');
    const opt = { duration: o.flipMs, fill: 'both' };
    const a1 = p.front.animate([{ transform: 'rotateX(0deg)', easing: ENTER }, { transform: 'rotateX(-90deg)', offset: .5 }, { transform: 'rotateX(-90deg)' }], opt);
    const a2 = p.back.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(90deg)', offset: .5, easing: LEAVE }, { transform: 'rotateX(0deg)' }], opt);
    p.anims = [a1, a2];
    a2.onfinish = () => { if (p.step >= p.seq.length - 1) p.tile.classList.remove('is-flip'); };
  }

  function loop(now, tok) {
    if (tok !== token) return;
    const e = now - t0; let live = false;
    for (const p of tiles) {
      if (p.done && p.step >= (p.seq?.length ?? 0) - 1) continue;
      const local = e - p.start;
      if (local < 0) { live = true; continue; }
      const step = Math.floor(local / o.flipMs);
      if (step < p.seq.length) { live = true; if (step !== p.step) { p.step = step; flip(p); } }
      else { p.done = true; p.step = p.seq.length - 1; p.cur = p.target; }
    }
    // плитки без смены символа уже на месте; все остальные доиграли -> конец
    if (live) raf = requestAnimationFrame((n) => loop(n, tok)); else { stop(); }
  }

  function update(text, animate = true) {
    if (text === last) return;
    const blocked = !animate || mqReduce?.matches || html.classList.contains('no-anim') || document.hidden;
    const from = shown();
    stop();
    last = text;
    if (blocked || !text) return;
    const built = build(text, from);
    if (!built) return;
    board = built.b; tiles = built.list;
    // у плиток без смены (символ тот же) шагов нет
    tiles.forEach((p) => { if (!p.seq) { p.step = -1; } });
    el.classList.add('rb-flap-busy');
    t0 = performance.now(); const tok = token;
    raf = requestAnimationFrame((n) => loop(n, tok));
  }

  return { update, cancel: () => { last = el.textContent; stop(); }, destroy() { stop(); el.classList.remove('rb-flap-host'); } };
}
