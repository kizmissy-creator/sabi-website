// Navigation remains usable without JavaScript. On small screens, enhance it
// with a compact disclosure; no visitor information is stored or transmitted.
(() => {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-navigation');
  const mobile = window.matchMedia('(max-width: 680px)');
  if (!toggle || !nav) return;
  function setOpen(open) {
    nav.hidden = mobile.matches && !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '−' : '+';
  }
  function sync() { toggle.hidden = !mobile.matches; setOpen(!mobile.matches); }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && !nav.hidden) { setOpen(false); toggle.focus(); }
  });
  mobile.addEventListener('change', sync);
  sync();
})();
