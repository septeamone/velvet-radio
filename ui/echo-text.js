/* Based on React Bits EchoText (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
 *
 * Призрачные копии слова: прилетают при появлении, потом остаются жить (медленный дрейф, режим trail auto)
 * и тянутся к курсору, пока он в окне. Подключается к существующему элементу (у нас h1.brand).
 *   const echo = initEchoText(document.querySelector('.brand'), { avoid: document.querySelector('.tools') });
 *   echo.play();  echo.finish();  echo.destroy();  echo.stats  // замеры кадра: { frames, sum, longest } в мс
 * Разметка после инициализации (текст элемента не теряется, копии скрыты от скринридера):
 *   <h1.brand><span.rb-echo-root><span.rb-echo-ghost aria-hidden/>×N <span.rb-echo-bursts aria-hidden/> <span.rb-echo-front>текст</span></span></h1>
 * Кадровый цикл (rAF) идёт только пока окно видно; при document.hidden полная остановка.
 * Reduced-motion и класс no-anim на <html>: без анимации. Меняются только transform и opacity (около 30 кадров/с), layout не читается в кадре.
 */
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const EASE = {
  linear: (t) => t,
  'ease-out': (t) => 1 - Math.pow(1 - t, 3),
  'ease-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  snappy: (t) => 1 - Math.pow(1 - t, 5),
};
const DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1], diagonal: [0.72, 0.72] };
const BURST_LIFE = 1100, BURST_GAP = 80, DRIFT_PERIOD = 7200, DRIFT_IDLE = 2600;

export function initEchoText(el, opts = {}) {
  const o = {
    echoes: 6, lag: 0.2, offset: 8, direction: 'up', fade: 0.6, blur: 0, echoScale: 1.25,
    duration: 1000, ease: 'ease-out', clickBurst: true, cursorRadius: 320, follow: 1, restLevel: 0.85,
    colors: ['currentColor', 'var(--accent)'], avoid: null, autoplay: true, ...opts,
  };
  const n = clamp(Math.round(o.echoes), 0, 24);
  const vec = DIRS[o.direction] || DIRS.up;
  const lag = clamp(o.lag, 0.02, 0.5), fade = clamp(o.fade, 0.1, 0.95), offset = clamp(o.offset, 0, 120);
  const reach = clamp(o.cursorRadius, 40, 1200), driftSpacing = 0.12 + lag * 1.1;
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

  // — состояние —
  const S = { frame: 0, last: 0, start: 0, dur: 0, strength: 1, activity: 0, tx: 0, ty: 0, drift: 1, phase: 0, near: false, ptime: -Infinity, cx: 0, cy: 0 };
  const pos = Array.from({ length: n + 1 }, () => ({ x: 0, y: 0 }));
  const shownOp = new Array(n + 1).fill(-1);
  const stats = { frames: 0, sum: 0, longest: 0 };
  let bursts = [], started = false;

  // границы обрезки: копии не вылезают за окно и не налезают на соседей (кнопки .tools)
  function setClip() {
    const r = root.getBoundingClientRect();
    S.cx = r.left + r.width / 2; S.cy = r.top + r.height / 2;
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
    S.frame = 0;
    if (document.hidden || blocked()) { finish(); return; }
    if (S.last && now - S.last < 28) { S.frame = requestAnimationFrame(tick); return; }   // 30 кадров/с хватает для медленного дрейфа, вдвое дешевле
    const t0 = performance.now();
    const dt = S.last ? clamp(now - S.last, 0, 64) : 16.67, step = dt / 16.67;
    S.last = now;
    const progress = S.dur > 0 ? clamp((now - S.start) / S.dur, 0, 1) : 1;
    const rest = (1 - easeFn(progress)) * S.strength;
    const away = !S.near || now - S.ptime > DRIFT_IDLE;
    S.drift += ((away ? 1 : 0) - S.drift) * (1 - Math.pow(0.965, step));
    S.phase += (dt / DRIFT_PERIOD) * Math.PI * 2;
    const fx = S.tx * (1 - S.drift), fy = S.ty * (1 - S.drift), scaleMax = clamp(o.echoScale, 0.25, 2.5);
    let maxSep = 0;
    for (let i = 1; i <= n; i++) {
      const c = pos[i], depth = i / n;
      let dx = fx + vec[0] * rest * offset * (i + 0.35), dy = fy + vec[1] * rest * offset * (i + 0.35);
      const ph = S.phase - i * driftSpacing, swing = offset * S.drift * (0.25 + 0.75 * depth);
      dx += Math.sin(ph) * swing; dy += Math.sin(ph) * Math.cos(ph) * swing * 1.3;
      const k = 1 - Math.pow(1 - clamp(0.34 / (1 + i * lag * 4.2), 0.018, 0.36), step);
      c.x += (dx - c.x) * k; c.y += (dy - c.y) * k;
      maxSep = Math.max(maxSep, Math.hypot(c.x, c.y));
      ghosts[i].style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0) scale(${(1 + (scaleMax - 1) * depth).toFixed(4)})`;
    }
    const sepAct = offset > 0 ? clamp(maxSep / (offset * 2.25), 0, 1) : 0;
    const target = Math.max(rest, sepAct, o.restLevel);   // эхо не гаснет в покое
    S.activity += (target - S.activity) * (1 - Math.pow(0.82, step));
    for (let i = 1; i <= n; i++) {
      const v = Math.round(Math.pow(fade, i) * S.activity * 500) / 500;
      if (v !== shownOp[i]) { shownOp[i] = v; ghosts[i].style.opacity = String(v); }
    }
    renderBursts(now);
    S.frame = requestAnimationFrame(tick);
    const d = performance.now() - t0; stats.frames++; stats.sum += d; if (d > stats.longest) stats.longest = d;
  }

  function loop() {
    if (S.frame || document.hidden || blocked()) return;
    S.last = 0; root.classList.add('is-on'); S.frame = requestAnimationFrame(tick);
  }

  function finish() {                                  // полная остановка: окно спрятано или анимацию отключили
    cancelAnimationFrame(S.frame); S.frame = 0; S.activity = 0;
    bursts.forEach((b) => b.nodes.forEach((x) => x.remove())); bursts = [];
    for (let i = 1; i <= n; i++) { pos[i].x = pos[i].y = 0; ghosts[i].style.opacity = '0'; shownOp[i] = 0; }
    root.classList.remove('is-on');
  }

  // появление: копии прилетают из-за слова и остаются жить (дрейф + курсор)
  function play(s = 1, ms = o.duration) {
    if (blocked() || document.hidden) return;
    setClip();
    S.strength = s; S.dur = ms; S.start = performance.now();
    if (!S.frame) S.activity = 1;
    loop();
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
    loop();
  }

  function onMove(e) {
    const dx = e.clientX - S.cx, dy = e.clientY - S.cy, dist = Math.hypot(dx, dy);
    const r = dist > 0 ? clamp(dist / reach, 0, 1) : 0;
    S.tx = dist > 0 ? (dx / dist) * r * offset * o.follow : 0;
    S.ty = dist > 0 ? (dy / dist) * r * offset * o.follow * 0.72 : 0;
    S.near = dist <= reach; S.ptime = performance.now();
  }
  const onOut = (e) => { if (e.relatedTarget) return; S.tx = S.ty = 0; S.near = false; };
  const onVis = () => { if (document.hidden) finish(); else if (started) play(0.0001, 0); };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerout', onOut);
  if (o.clickBurst) root.addEventListener('click', burst);
  document.addEventListener('visibilitychange', onVis);

  // автозапуск: ждём, пока окно снимет no-anim (после первой отрисовки)
  let obs = null;
  if (o.autoplay) {
    if (html.classList.contains('no-anim')) {
      obs = new MutationObserver(() => { if (!html.classList.contains('no-anim')) { obs.disconnect(); obs = null; started = true; play(); } });
      obs.observe(html, { attributes: true, attributeFilter: ['class'] });
    } else { started = true; play(); }
  }

  return {
    play, finish, stats,
    destroy() {
      finish(); obs?.disconnect();
      window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerout', onOut);
      root.removeEventListener('click', burst); document.removeEventListener('visibilitychange', onVis); el.textContent = text;
    },
  };
}
