const root = document.documentElement;
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const themeToggle = document.querySelector('.theme-toggle');
const headerBand = document.querySelector('.header-band');
const themeStorageKey = 'meet-portfolio-theme';
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 800px)');
let savedTheme;

try {
  const stored = localStorage.getItem(themeStorageKey);
  if (stored === 'light' || stored === 'dark') savedTheme = stored;
} catch {
  // Applying a theme does not depend on browser storage.
}

const applyTheme = (theme) => {
  root.dataset.theme = theme;
  themeToggle?.setAttribute('aria-pressed', String(theme === 'dark'));
  if (themeToggle) themeToggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.content = theme === 'dark' ? '#1b2230' : '#f7f8fc';
};

applyTheme(savedTheme || (systemTheme.matches ? 'dark' : 'light'));
root.classList.add('has-js');

const updateHeaderHeight = () => {
  const height = Math.ceil(headerBand?.getBoundingClientRect().height || 0);
  if (height) root.style.setProperty('--header-height', `${height}px`);
  return height;
};
updateHeaderHeight();
if (headerBand && typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderHeight).observe(headerBand);

themeToggle?.addEventListener('click', () => {
  savedTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(savedTheme);
  try {
    localStorage.setItem(themeStorageKey, savedTheme);
  } catch {
    // The selected theme still works for the current document.
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

const closeNav = (restoreFocus = false) => {
  navToggle?.setAttribute('aria-expanded', 'false');
  navToggle?.setAttribute('aria-label', 'Open navigation');
  nav?.classList.remove('is-open');
  updateHeaderHeight();
  if (restoreFocus) navToggle?.focus();
};

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  nav?.classList.toggle('is-open', !isOpen);
  updateHeaderHeight();
});
nav?.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (link) closeNav(mobile.matches && link.hasAttribute('download'));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') closeNav(true);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header-band')) closeNav();
});
mobile.addEventListener('change', (event) => {
  closeNav(event.matches && nav?.contains(document.activeElement));
});

function scrollToAnchor(id, { focus = false, smooth = false } = {}) {
  const target = document.getElementById(id);
  if (!target) return;
  closeNav();
  const offset = updateHeaderHeight() + 20;
  const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
  window.scrollTo({ top, behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
  if (focus) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || link.hasAttribute('download') || link.target || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  let id;
  try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
  if (!document.getElementById(id)) return;
  event.preventDefault();
  if (location.hash !== url.hash) history.pushState(null, '', url.hash);
  scrollToAnchor(id, { focus: true, smooth: true });
});

const alignHash = (focus = false) => {
  if (!location.hash) return;
  try { scrollToAnchor(decodeURIComponent(location.hash.slice(1)), { focus }); } catch { /* Ignore an invalid URL fragment. */ }
};
requestAnimationFrame(() => alignHash());
document.fonts?.ready.then(() => alignHash());
window.addEventListener('load', () => alignHash(), { once: true });
window.addEventListener('hashchange', () => alignHash(true));

if (document.body.classList.contains('page-home')) {
  const sectionLinks = [...document.querySelectorAll('.nav-links [data-section]')];
  const sections = sectionLinks.map((link) => document.getElementById(link.dataset.section)).filter(Boolean);
  let ticking = false;
  const updateActiveSection = () => {
    ticking = false;
    const offset = (headerBand?.getBoundingClientRect().height || 0) + 95;
    let current = sections[0]?.id;
    for (const section of sections) if (section.getBoundingClientRect().top <= offset) current = section.id;
    if (window.scrollY + innerHeight >= document.documentElement.scrollHeight - 3) current = sections.at(-1)?.id;
    for (const link of sectionLinks) {
      if (link.dataset.section === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const scheduleUpdate = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateActiveSection); }
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  updateActiveSection();
}
