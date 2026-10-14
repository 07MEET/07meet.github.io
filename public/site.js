const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

if (navToggle && nav) {
  document.documentElement.classList.add('has-js');
  const close = (restoreFocus = false) => {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
    if (restoreFocus) navToggle.focus();
  };
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    nav.classList.toggle('is-open', !isOpen);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') close(true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) close();
  });
  const mobile = matchMedia('(max-width: 680px)');
  mobile.addEventListener('change', () => close());
}
