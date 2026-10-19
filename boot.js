// Применяет вид и тему до первой отрисовки (читает копию из localStorage), чтобы окно не мигало чужим оформлением.
try {
  const r = document.documentElement, ui = localStorage.getItem('vr-ui'), th = localStorage.getItem('vr-theme');
  if (ui === 'classic' || ui === 'new') r.dataset.ui = ui;
  if (th === 'dark' || th === 'light') r.dataset.theme = th;
} catch {}
