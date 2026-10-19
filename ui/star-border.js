// Based on React Bits StarBorder (MIT + Commons Clause, © David Haz), ported to plain JS/CSS.
// Тонкая «звезда» бежит по контуру кнопки, пока у .player класс loading. Вся анимация в CSS (transform), JS только добавляет кольцо.
// Использование: initStarBorder(document.querySelector('.play'))  ->  { destroy() }
export function initStarBorder(btn) {
  if (!btn) return null;
  if (btn.__rbStar) return btn.__rbStar;
  const ring = Object.assign(document.createElement('span'), { className: 'rb-sb-ring' });
  ring.setAttribute('aria-hidden', 'true');
  ring.appendChild(document.createElement('i'));
  btn.appendChild(ring);
  btn.classList.add('rb-sb');
  const api = { destroy() { ring.remove(); btn.classList.remove('rb-sb'); delete btn.__rbStar; } };
  btn.__rbStar = api;
  return api;
}
