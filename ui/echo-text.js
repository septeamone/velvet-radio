/* Based on React Bits EchoText (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
 *
 * Призрачные копии слова догоняют его и сливаются в одно. Подключается к уже существующему элементу (у нас h1.brand).
 *   const echo = initEchoText(document.querySelector('.brand'), { avoid: document.querySelector('.tools') });
 *   echo.play();  echo.finish();  echo.destroy();
 * Разметка после инициализации (текст элемента не теряется, копии скрыты от скринридера):
 *   <h1.brand><span.rb-echo-root><span.rb-echo-ghost aria-hidden/>×N <span.rb-echo-bursts aria-hidden/> <span.rb-echo-front>текст</span></span></h1>
 * Кадровый цикл (rAF) живёт только пока идёт анимация; в покое его нет. Reduced-motion и класс no-anim на <html>: без анимации.
 */
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const EASE = {
  linear: (t) => t,
  'ease-out': (t) => 1 - Math.pow(1 - t, 3),
  'ease-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  snappy: (t) => 1 - Math.pow(1 - t, 5),
};
const DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1], diagonal: [0.72, 0.72] };
const BURST_LIFE = 1100, BURST_GAP = 80;

export function initEchoText(el, opts = {}) {
  const o = {
    echoes: 7, lag: 0.2, offset: 9, direction: 'up', fade: 0.75, blur: 0, echoScale: 1.4,
    duration: 1000, ease: 'ease-out', clickBurst: true, hover: true, hoverStrength: 0.6, hoverDuration: 800,
    colors: ['currentColor', 'var(--accent)'], avoid: null, autoplay: true, ...opts,
  };
  const n = clamp(Math.round(o.echoes), 0, 24);
  const vec = DIRS[o.direction] || DIRS.up;
  const lag = clamp(o.lag, 0.02, 0.5), fade = clamp(o.fade, 0.1, 0.95), offset = clamp(o.offset, 0, 120);
  const easeFn = EASE[o.ease] || EASE['ease-out'];
  const html = document.documentElement;
  const mqReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const blocked = () => !n || mqReduce?.matches || html.classList.contains('no-anim');

  // — разметка —
  const text = el.textContent;
  const root = document.createElement('span'); root.className = 'rb-echo-root';
  const ghosts = [];
  for (let i = n; i >= 1; i--) {                       // глубокие копии рисуются первыми, т. е. под ближними
    const g = document.createElement('span');
    g.className = 'rb-echo-ghost'; g.setAttribute('aria-hidden', 'true'); g.textContent = text;
    const depth = n > 1 ? (i - 1) / (n - 1) : 0;
    g.style.color = `color-mix(in srgb, ${o.colors[o.colors.length - 1]} ${Math.round(depth * 100)}%, ${o.colors[0]})`;
    if (o.blur > 0) g.style.filter = `blur(${((o.blur * i) / n).toFixed(2)}px)`;
    ghosts[i] = g; root.append(g);
  }
  const layer = document.createElement('span'); layer.className = 'rb-echo-bursts'; layer.setAttribute('aria-hidden', 'true');
  const front = document.createElement('span'); front.className = 'rb-echo-front'; front.textContent = text;
  root.append(layer, front);
  el.replaceChildren(root);

  // — состояние анимации —
  let frame = 0, last = 0, start = 0, dur = 0, strength = 1, activity = 0, running = false;
  const pos = Array.from({ length: n + 1 }, () => ({ x: 0, y: 0 }));
  let bursts = [];

  // границы обрезки: копии не вылезают за окно и не налезают на соседей (кнопки .tools)
  function setClip() {
    const r = root.getBoundingClientRect();
    let x = 40;
    if (o.avoid) { const a = o.avoid.getBoundingClientRect(); if (a.width) x = Math.min(x, a.left - r.right - 4, r.left - 4); }
    const top = clamp(r.top - 2, 2, 24);
    root.style.setProperty('--rb-clip-x', `${Math.max(0, x).toFixed(1)}px`);
    root.style.setProperty('--rb-clip-t', `${top.toFixed(1)}px`);
  }

  function renderBursts(now) {
    bursts = bursts.filter((b) => {
      const age = now - b.t0; let alive = false;
      b.nodes.forEach((node, i) => {
        const local = (age - i * BURST_GAP) / BURST_LIFE;
        if (local < 1) alive = true;
        const p = clamp(local, 0, 1), spread = 1 - Math.pow(1 - p, 3);
        const peak = 0.7 * Math.pow(fade, i * 0.5);
        node.style.transform = `scale(${(1 + spread * 0.16 * (i + 1)).toFixed(4)})`;
        node.style.opacity = (local <= 0 ? 0 : Math.min(1, p * 8) * Math.pow(1 - p, 1.5) * peak).toFixed(3);
      });
      if (!alive) b.nodes.forEach((x) => x.remove());
      return alive;
    });
  }

  function tick(now) {
    frame = 0;
    const dt = last ? clamp(now - last, 0, 64) : 16.67, step = dt / 16.67;
    last = now;
    const progress = dur > 0 ? clamp((now - start) / dur, 0, 1) : 1;
    const rest = (1 - easeFn(progress)) * strength;
    let maxSep = 0;
    for (let i = 1; i <= n; i++) {
      const c = pos[i], g = ghosts[i];
      const dx = vec[0] * rest * offset * (i + 0.35), dy = vec[1] * rest * offset * (i + 0.35);
      const k = 1 - Math.pow(1 - clamp(0.34 / (1 + i * lag * 4.2), 0.018, 0.36), step);
      c.x += (dx - c.x) * k; c.y += (dy - c.y) * k;
            maxSep = Math.max(maxSep, Math.hypot(c.x, c.y));
      const sc = 1 + (clamp(o.echoScale, 0.25, 2.5) - 1) * (i / n);
      g.style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
    }
    const sepAct = offset > 0 ? clamp(maxSep / (offset * 2.25), 0, 1) : 0;
    activity += (Math.max(rest, sepAct) - activity) * (1 - Math.pow(0.82, step));
    renderBursts(now);
    running = progress < 1 || activity > 0.03 || bursts.length > 0;   // хвост, где копии уже невидимы, не тянем
    if (!running) { activity = 0; for (let i = 1; i <= n; i++) pos[i].x = pos[i].y = 0; }
    for (let i = 1; i <= n; i++) ghosts[i].style.opacity = String(Math.pow(fade, i) * activity);
    if (running) frame = requestAnimationFrame(tick); else root.classList.remove('is-on');
  }

  function finish() {                                  // мгновенно в покой (окно спрятано, или анимацию отключили)
    cancelAnimationFrame(frame); frame = 0; running = false; activity = 0;
    bursts.forEach((b) => b.nodes.forEach((x) => x.remove())); bursts = [];
    for (let i = 1; i <= n; i++) { pos[i].x = pos[i].y = 0; ghosts[i].style.opacity = '0'; }
    root.classList.remove('is-on');
  }

  function play(s = 1, ms = o.duration) {
    if (blocked() || document.hidden) return;
    setClip();
    strength = s; dur = ms; start = performance.now(); last = 0;
    if (!running) activity = 1;
    root.classList.add('is-on');
    running = true;
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function burst(e) {
    if (blocked() || document.hidden) return;
    setClip();
    const r = root.getBoundingClientRect();
    const ox = clamp((e.clientX - r.left) / (r.width || 1), 0, 1) * 100, oy = clamp((e.clientY - r.top) / (r.height || 1), 0, 1) * 100;
    const count = clamp(Math.round(n / 3) + 2, 3, 6), nodes = [];
    for (let i = 0; i < count; i++) {
      const src = ghosts[1 + Math.round((i / Math.max(1, count - 1)) * (n - 1))];
      const node = src.cloneNode(true);
      node.style.transformOrigin = `${ox.toFixed(1)}% ${oy.toFixed(1)}%`; node.style.opacity = '0'; node.style.transform = '';
      layer.append(node); nodes.push(node);
    }
    bursts.push({ t0: performance.now(), nodes });
    while (bursts.length > 4) bursts.shift().nodes.forEach((x) => x.remove());
    root.classList.add('is-on');
    running = true;
    if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
  }

  const onEnter = () => { if (!running || performance.now() - start > dur) play(o.hoverStrength, o.hoverDuration); };
  const onVis = () => { if (document.hidden) finish(); };
  if (o.hover) root.addEventListener('pointerenter', onEnter);
  if (o.clickBurst) root.addEventListener('click', burst);
  document.addEventListener('visibilitychange', onVis);

  // автозапуск: ждём, пока окно снимет no-anim (после первой отрисовки), и играем один раз
  let obs = null;
  if (o.autoplay) {
    if (html.classList.contains('no-anim')) {
      obs = new MutationObserver(() => { if (!html.classList.contains('no-anim')) { obs.disconnect(); obs = null; play(); } });
      obs.observe(html, { attributes: true, attributeFilter: ['class'] });
    } else play();
  }

  return {
    play, finish,
    destroy() { finish(); obs?.disconnect(); root.removeEventListener('pointerenter', onEnter); root.removeEventListener('click', burst); document.removeEventListener('visibilitychange', onVis); el.textContent = text; },
  };
}
