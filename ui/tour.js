// Интерактивный тур для новых пользователей: затемнение с «окном» вокруг нужного элемента (spotlight), карточка-подсказка
// (coach mark) с кнопками «Назад», «Далее», «Пропустить», пружинные переходы. Прогресс сохраняется при каждом шаге:
// окно расширения закрывается от любого клика мимо, поэтому при следующем открытии тур продолжается с того же места.
// Первый шаг — выбор своей страны (она станет первой вкладкой). Только JS и CSS (ui/tour.css), из сети ничего не грузится.
//
// createTour(api) → { start(state), stop() }. Всё, что касается окна, приходит через api (popup.js): тур ничего не знает о каталоге.

const STEPS = [
  { id: 'welcome', sel: ['.tabs'], pick: true, wide: true },        // подсвечены вкладки: видно, как выбор страны меняет первую из них
  { id: 'tabs', sel: ['.tabs'] },
  { id: 'search', sel: ['.searchrow'] },
  { id: 'row', sel: ['#list .row'] },
  { id: 'quality', sel: ['#list .row .seg'] },
  { id: 'heart', sel: ['#list .row .heart'] },
  { id: 'player', sel: ['.player'] },
  { id: 'settings', sel: ['#gear'] },
];
export const TOUR_VERSION = 1;
const PAD = 6, GAP = 12, MARGIN = 10;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Страна «по умолчанию» для выбора: сначала регион языка браузера (en-GB → GB), потом сам язык (de → DE)
const LANG_CC = { ru: 'RU', uk: 'UA', be: 'BY', kk: 'KZ', uz: 'UZ', hy: 'AM', az: 'AZ', ka: 'GE', en: 'US', de: 'DE', fr: 'FR', it: 'IT', es: 'ES', nl: 'NL', pl: 'PL', sv: 'SE', tr: 'TR', zh: 'CN', ja: 'JP', ko: 'KR', hi: 'IN', pt: 'BR', ar: 'AE' };
export function suggestCountry(available) {
  const [lang, region] = (navigator.language || 'ru').split('-');
  for (const cc of [region?.toUpperCase(), LANG_CC[lang?.toLowerCase()]]) if (cc && available.includes(cc)) return cc;
  return available.includes('RU') ? 'RU' : available[0];
}

export function createTour(api) {
  const { t } = api;
  let root, hole, card, body, titleEl, textEl, pickEl, countEl, dotsEl, backBtn, nextBtn, skipBtn, arrow;
  let state = null, i = 0, active = false, token = 0, suggested = null, lastFocus = null;

  /* ---------- разметка ---------- */
  function build() {
    root = document.createElement('div');
    root.className = 'tour';
    root.innerHTML = `
      <div class="tour-hole"></div>
      <section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text">
        <i class="tour-arrow"></i>
        <div class="tour-meta"><span class="tour-count"></span><button type="button" class="tour-skip"></button></div>
        <div class="tour-body">
          <div class="tour-brand">Velvet Radio</div>
          <h2 id="tour-title" class="tour-title"></h2>
          <p id="tour-text" class="tour-text"></p>
          <div class="tour-pickwrap"><div class="tour-label"></div><div class="tour-pick" role="radiogroup"></div></div>
        </div>
        <div class="tour-foot">
          <div class="tour-dots" aria-hidden="true">${STEPS.map(() => '<i></i>').join('')}</div>
          <div class="tour-actions"><button type="button" class="tour-btn tour-back"></button><button type="button" class="tour-btn tour-next"></button></div>
        </div>
      </section>`;
    const q = (s) => root.querySelector(s);
    hole = q('.tour-hole'); card = q('.tour-card'); body = q('.tour-body'); arrow = q('.tour-arrow');
    titleEl = q('.tour-title'); textEl = q('.tour-text'); pickEl = q('.tour-pick'); countEl = q('.tour-count'); dotsEl = q('.tour-dots');
    backBtn = q('.tour-back'); nextBtn = q('.tour-next'); skipBtn = q('.tour-skip');
    q('.tour-label').textContent = t('tourPick');
    backBtn.textContent = t('tourBack');
    skipBtn.textContent = t('tourSkip');
    card.setAttribute('aria-label', t('tourAria'));
    backBtn.addEventListener('click', () => go(i - 1, -1));
    nextBtn.addEventListener('click', () => (i === STEPS.length - 1 ? finish(false) : go(i + 1, 1)));
    skipBtn.addEventListener('click', () => finish(true));
    root.addEventListener('pointerdown', (e) => {                           // клик по затемнению: мягко «встряхиваем» карточку, окно под ним не трогаем
      if (e.target === root || e.target === hole) { card.classList.remove('nudge'); void card.offsetWidth; card.classList.add('nudge'); }
    });
    pickEl.addEventListener('click', (e) => { const b = e.target.closest('.tour-chip'); if (b) choose(b.dataset.cc); });
    document.body.append(root);
  }

  function fillPick() {
    const list = api.countries();
    suggested = suggestCountry(list);
    const cur = api.home();
    const order = [...list].sort((a, b) => (a === suggested ? -1 : b === suggested ? 1 : api.countryName(a).localeCompare(api.countryName(b), api.lang())));
    pickEl.replaceChildren(...order.map((cc) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tour-chip'; b.dataset.cc = cc;
      b.setAttribute('role', 'radio');
      b.innerHTML = `<img alt="" src="${api.flagSrc(cc)}"><span></span>${cc === suggested ? '<i class="tour-dot" title=""></i>' : ''}`;
      b.querySelector('span').textContent = api.countryName(cc);
      if (cc === suggested) b.querySelector('.tour-dot').title = t('tourSuggest');
      b.classList.toggle('on', cc === cur); b.setAttribute('aria-checked', cc === cur);
      return b;
    }));
  }
  async function choose(cc) {
    for (const b of pickEl.children) { const on = b.dataset.cc === cc; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }
    state = { ...state, picked: true };
    api.save(state);
    await api.setHome(cc);
  }

  /* ---------- геометрия ---------- */
  function measure(step) {
    const els = step.sel.map((s) => document.querySelector(s)).filter(Boolean);
    if (!els.length) return undefined;                                       // элемента нет (например, пустой список): шаг пропускаем
    const h = root.getBoundingClientRect();
    let l = 1e9, tp = 1e9, r = -1e9, b = -1e9;
    for (const el of els) { const q = el.getBoundingClientRect(); l = Math.min(l, q.left); tp = Math.min(tp, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
    const x = Math.max(3, l - h.left - PAD), y = Math.max(3, tp - h.top - PAD);
    return { x, y, w: Math.min(root.clientWidth - 3, r - h.left + PAD) - x, h: Math.min(root.clientHeight - 3, b - h.top + PAD) - y };
  }
  function place(rect) {
    const W = root.clientWidth, H = root.clientHeight;
    const cw = card.offsetWidth, ch = card.offsetHeight;
    hole.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;opacity:1`;
    const below = rect.y + rect.h + GAP + ch <= H - MARGIN;
    const above = rect.y - GAP - ch >= MARGIN;
    const side = below || !above ? 'below' : 'above';
    const y = clamp(side === 'below' ? rect.y + rect.h + GAP : rect.y - GAP - ch, MARGIN, H - ch - MARGIN);
    const x = clamp(rect.x + rect.w / 2 - cw / 2, MARGIN, W - cw - MARGIN);
    card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    card.dataset.side = y < rect.y ? 'above' : 'below';
    arrow.style.left = `${clamp(rect.x + rect.w / 2 - x, 20, cw - 20)}px`;
  }

  /* ---------- шаги ---------- */
  function fill(step) {
    const n = i + 1, total = STEPS.length;
    titleEl.textContent = t(`tour_${step.id}_t`);
    textEl.textContent = t(`tour_${step.id}_d`);
    card.classList.toggle('wide', !!step.wide);
    body.querySelector('.tour-brand').hidden = !step.wide;
    body.querySelector('.tour-pickwrap').hidden = !step.pick;
    countEl.textContent = t('tourOf', { n, total });
    [...dotsEl.children].forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'now' : ''; });
    backBtn.style.visibility = i === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = i === total - 1 ? t('tourDone') : t('tourNext');
    skipBtn.style.visibility = i === total - 1 ? 'hidden' : 'visible';
  }

  async function go(n, dir = 1, first = false) {
    if (n < 0) return;
    if (n >= STEPS.length) return finish(false);
    const my = ++token;
    i = n;
    state = { ...state, v: TOUR_VERSION, step: n, done: false };
    api.save(state);
    const step = STEPS[n];
    api.prepare();
    await frame(); await frame();
    if (my !== token) return;
    let rect = measure(step);
    if (rect === undefined) return go(n + dir, dir, first);
    if (!first && !reduced()) { body.classList.add('out'); await sleep(110); if (my !== token) return; }
    if (step.pick) fillPick();
    fill(step);
    body.classList.remove('out');
    await frame();
    place(rect);
    hole.classList.remove('ping'); void hole.offsetWidth; hole.classList.add('ping');
    (step.pick ? pickEl.querySelector('.on') ?? nextBtn : nextBtn).focus({ preventScroll: true });
    setTimeout(() => { if (my === token && active) { const r2 = measure(step); if (r2 !== undefined) place(r2); } }, 450);   // список ещё «въезжает» при открытии: уточняем положение
  }

  async function finish(skipped) {
    if (!active) return;
    active = false; token++;
    state = { ...state, v: TOUR_VERSION, done: true, skipped: !!skipped };
    api.save(state);
    window.removeEventListener('keydown', onKey, true);
    root.classList.add('closing');
    hole.style.cssText = `left:${root.clientWidth / 2}px;top:${root.clientHeight / 2}px;width:0;height:0;opacity:0`;
    await sleep(reduced() ? 0 : 260);
    root.remove();
    lastFocus?.focus?.({ preventScroll: true });
    api.onDone?.({ skipped: !!skipped });
  }

  /* ---------- клавиатура: стрелки и Esc, Tab не выходит из карточки, горячие клавиши окна на время тура отключены ---------- */
  function onKey(e) {
    if (!active) return;
    if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('button')].filter((b) => b.offsetParent && b.style.visibility !== 'hidden');
      if (!f.length) return;
      const k = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    } else if (e.key === 'Escape') { e.preventDefault(); finish(true); }
    else if (e.target.closest?.('.tour-pick') && /^Arrow/.test(e.key)) {
      const c = [...pickEl.children], k = c.indexOf(document.activeElement);
      if (k >= 0) { e.preventDefault(); c[clamp(k + (/Right|Down/.test(e.key) ? 1 : -1), 0, c.length - 1)].focus(); }
    } else if (e.key === 'ArrowRight') { e.preventDefault(); i === STEPS.length - 1 ? finish(false) : go(i + 1, 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1, -1); }
    e.stopPropagation();
  }

  /* ---------- запуск ---------- */
  async function start(saved) {
    if (active) return;
    active = true;
    lastFocus = document.activeElement;
    state = { v: TOUR_VERSION, step: 0, done: false, ...saved };
    build();
    window.addEventListener('keydown', onKey, true);
    await go(clamp(state.step | 0, 0, STEPS.length - 1), 1, true);
    if (!state.picked && STEPS[i].pick) { await choose(suggested ?? api.home()); }   // новый пользователь сразу видит свои станции; поменять можно кликом
    root.classList.add('open');
  }
  function stop() { active = false; token++; window.removeEventListener('keydown', onKey, true); root?.remove(); }

  return { start, stop, get active() { return active; } };
}
