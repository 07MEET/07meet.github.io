const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const themeToggle = document.querySelector('.theme-toggle');
const themeStorageKey = 'meet-portfolio-theme';
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let savedTheme;

try {
  const stored = localStorage.getItem(themeStorageKey);
  if (stored === 'light' || stored === 'dark') savedTheme = stored;
} catch {
  // The current page remains usable when browser storage is unavailable.
}

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  }
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.content = theme === 'dark' ? '#1b2230' : '#f7f8fc';
};

applyTheme(savedTheme || (systemTheme.matches ? 'dark' : 'light'));
document.documentElement.classList.add('has-js');

const headerBand = document.querySelector('.header-band');
if (headerBand && typeof ResizeObserver !== 'undefined') {
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-height', `${Math.ceil(headerBand.getBoundingClientRect().height)}px`);
  };
  updateHeaderHeight();
  new ResizeObserver(updateHeaderHeight).observe(headerBand);
}

themeToggle?.addEventListener('click', () => {
  savedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(savedTheme);
  try {
    localStorage.setItem(themeStorageKey, savedTheme);
  } catch {
    // Applying the theme does not depend on saving the preference.
  }
});

systemTheme.addEventListener('change', (event) => {
  if (!savedTheme) applyTheme(event.matches ? 'dark' : 'light');
});

window.addEventListener('storage', (event) => {
  if (event.key !== themeStorageKey && event.key !== null) return;
  savedTheme = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : undefined;
  applyTheme(savedTheme || (systemTheme.matches ? 'dark' : 'light'));
});

if (navToggle && nav) {
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
