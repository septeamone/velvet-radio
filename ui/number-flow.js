/* Smooth number: digits slide past each other with a light blur. Inspired by NumberFlow; the rest of the look follows React Bits (MIT + Commons Clause, © David Haz), plain JS/CSS. */
const DIGIT = { duration: 340, easing: 'cubic-bezier(.3, .9, .3, 1)' };

export function numberFlow(host, input) {
  const root = document.documentElement;
  const el = document.createElement('span');
  el.className = 'rb-num';
  el.setAttribute('aria-hidden', 'true');
  const digits = document.createElement('span');
  digits.className = 'rb-num-d';
  const pc = Object.assign(document.createElement('span'), { className: 'rb-num-pc', textContent: '%' });
  el.append(digits, pc);
  host.append(el);

  let prev = '';
  const calm = () => document.hidden || root.classList.contains('no-anim') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  function set(n) {
    const s = String(n);
    if (s === prev) return;
    if (calm() || s.length !== prev.length) {                       // другое число знаков или без анимации: просто перестроить
      digits.replaceChildren(...[...s].map((ch) => {
        const cell = Object.assign(document.createElement('span'), { className: 'rb-num-c' });
        cell.append(Object.assign(document.createElement('span'), { className: 'rb-num-cur', textContent: ch }));
        return cell;
      }));
    } else {
      [...s].forEach((ch, i) => {
        const cell = digits.children[i], cur = cell.querySelector('.rb-num-cur');
        if (cur.textContent === ch) return;
        const dir = +ch > +cur.textContent ? 1 : -1;
        const out = Object.assign(document.createElement('span'), { className: 'rb-num-out', textContent: cur.textContent });
        cur.textContent = ch;
        cell.append(out);
        out.animate([{ transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }, { transform: `translateY(${-dir * 55}%)`, opacity: 0, filter: 'blur(2px)' }], DIGIT).onfinish = () => out.remove();
        cur.animate([{ transform: `translateY(${dir * 55}%)`, opacity: 0, filter: 'blur(2px)' }, { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }], DIGIT);
      });
    }
    prev = s;
  }
  const read = () => set(Math.round(+input.value * 100));
  input.addEventListener('input', read);
  read();
  return { destroy() { input.removeEventListener('input', read); el.remove(); } };
}
