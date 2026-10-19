// Based on React Bits GlareHover (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// При наведении по кнопке один раз пробегает тихий блик. Анимация в CSS, JS ставит класс на время одного прогона.
// Использование: initGlareHover(document.querySelector('.play'))  ->  { destroy() }
export function initGlareHover(btn) {
  if (!btn) return null;
  if (btn.__rbGlare) return btn.__rbGlare;
  const g = Object.assign(document.createElement('span'), { className: 'rb-gh' });
  g.setAttribute('aria-hidden', 'true');
  g.appendChild(document.createElement('i'));
  btn.appendChild(g);
  btn.classList.add('rb-gh-host');
  const enter = (e) => { if (e.pointerType !== 'touch' && !btn.classList.contains('rb-gh-run')) btn.classList.add('rb-gh-run'); };
  const done = () => btn.classList.remove('rb-gh-run');
  btn.addEventListener('pointerenter', enter);
  g.firstChild.addEventListener('animationend', done);
  const api = { destroy() { btn.removeEventListener('pointerenter', enter); g.remove(); btn.classList.remove('rb-gh-host', 'rb-gh-run'); delete btn.__rbGlare; } };
  btn.__rbGlare = api;
  return api;
}
