import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const dist = path.join(root, 'dist');
const segments = String(site.basePath || '/').split('/').filter(Boolean);
const base = `/${segments.join('/')}${segments.length ? '/' : ''}`;
const origin = site.siteUrl.replace(/\/$/, '');
const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const route = (page = '') => `${base}${page ? `${page}/` : ''}`;
const asset = (file) => /^(https?:)?\/\//.test(file) ? file : `${base}${String(file).replace(/^\/+/, '')}`;
const version = async (file) => createHash('sha256').update(await readFile(path.join(root, 'public', file))).digest('hex').slice(0, 10);
const [cssVersion, jsVersion] = await Promise.all([version('site.css'), version('site.js')]);
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const externalArrow = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const downloadIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg>';
const photoIcon = '<svg viewBox="0 0 32 32" aria-hidden="true" class="media-icon"><rect x="4" y="5" width="24" height="22" rx="3"/><circle cx="12" cy="12" r="2"/><path d="m5 23 7-7 5 5 5-8 5 8"/></svg>';
const videoIcon = '<svg viewBox="0 0 32 32" aria-hidden="true" class="media-icon"><rect x="4" y="5" width="24" height="22" rx="3"/><path d="M10 5v22M22 5v22M4 11h6m-6 10h6M22 11h6m-6 10h6"/></svg>';
const monogram = '<svg class="wordmark-symbol" viewBox="0 0 40 36" fill="none" aria-hidden="true"><path d="M4 28V8l10 15L24 8v20M24 8h5a7 7 0 0 1 0 14h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const themeBootstrap = `<script>(function(){var theme;try{theme=localStorage.getItem('meet-portfolio-theme')}catch(e){}if(theme!=='light'&&theme!=='dark'){try{theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){theme='light'}}document.documentElement.dataset.theme=theme;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?'#1b2230':'#f7f8fc'})();</script>`;
const themeButton = `<button class="theme-toggle" type="button" aria-label="Dark theme" aria-pressed="false" title="Switch to dark theme"><svg class="icon theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 14.3A8.7 8.7 0 0 1 9.7 3.6 8.8 8.8 0 1 0 20.4 14.3Z"/></svg><svg class="icon theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg></button>`;
const resumePath = typeof site.resume === 'string' ? site.resume : site.resume?.file;
const navItems = [{ id: 'about', label: 'About' }, { id: 'skills', label: 'Skills' }, { id: 'projects', label: 'Projects' }, { id: 'contact', label: 'Contact' }];
const slugs = { copilot: 'enterprise-knowledge-copilot', forecasting: 'pm25-forecasting-system', hospital: 'hospital-management-system', 'vl-jepa': 'vl-jepa' };
const detailRoute = (project) => route(`projects/${slugs[project.id] || project.id}`);

function header(isHome) {
  return `<a class="skip-link" href="#main">Skip to content</a><header class="header-band"><div class="site-header wrap"><div class="header-brand"><a class="wordmark" href="${escape(`${base}#about`)}" aria-label="${escape(site.shortName)}, introduction">${monogram}${escape(site.shortName)}</a>${themeButton}</div><button class="nav-toggle" type="button" aria-label="Open navigation" aria-controls="site-nav" aria-expanded="false"><span>Menu</span><span class="menu-mark" aria-hidden="true"><i></i><i></i></span></button><nav id="site-nav" class="site-nav" aria-label="Main navigation"><ul class="nav-links">${navItems.map(({ id, label }) => `<li><a href="${escape(`${base}#${id}`)}" data-section="${id}"${(isHome && id === 'about') || (!isHome && id === 'projects') ? ' aria-current="location"' : ''}>${label}</a></li>`).join('')}</ul>${resumePath ? `<a class="resume-link" href="${escape(asset(resumePath))}" download aria-label="Download ${escape(site.shortName)}'s resume as a PDF">Resume ${downloadIcon}</a>` : ''}</nav></div></header>`;
}

function head(title, description, page, canonicalPath = route(page), extraHead = '') {
  const canonical = `${origin}${canonicalPath}`;
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#f7f8fc">${themeBootstrap}<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta property="og:site_name" content="${escape(site.shortName)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:image" content="${escape(`${origin}${asset('assets/social.png')}`)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Meet Patel. AI/ML student, Python and SQL, Class of 2027."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(`${origin}${asset('assets/social.png')}`)}"><link rel="icon" type="image/svg+xml" href="${escape(asset('favicon.svg'))}"><link rel="preload" href="${escape(asset('assets/fonts/manrope.ttf'))}" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="${escape(asset('site.css'))}?v=${cssVersion}"><script src="${escape(asset('site.js'))}?v=${jsVersion}" defer></script>${extraHead}`;
}

const footer = `<footer class="site-footer-band"><div class="site-footer wrap"><p>© ${new Date().getFullYear()} ${escape(site.name)}</p></div></footer>`;
function document({ page = '', title, description, content, structuredData, canonicalPath, extraHead = '' }) {
  return `<!doctype html><html lang="en"><head>${head(title, description, page, canonicalPath, extraHead)}${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>` : ''}</head><body class="${page ? 'page-detail' : 'page-home'}">${header(!page)}<main id="main" tabindex="-1">${content}</main>${footer}</body></html>`;
}

function imageMarkup(image, className = '') {
  return `<figure${className ? ` class="${className}"` : ''}><img src="${escape(asset(image.src))}" alt="${escape(image.alt)}"${image.width ? ` width="${escape(image.width)}"` : ''}${image.height ? ` height="${escape(image.height)}"` : ''} loading="lazy" decoding="async">${image.caption ? `<figcaption>${escape(image.caption)}</figcaption>` : ''}</figure>`;
}

function media(project) {
  const images = project.images || [];
  const photos = images.length ? `<div class="photo-gallery${images.length === 1 ? ' single-photo' : ''}">${images.map((image) => imageMarkup(image)).join('')}</div>` : `<div class="media-placeholder photos-placeholder">${photoIcon}<p>Project photos coming soon</p></div>`;
  const video = project.video;
  const captions = typeof video?.captions === 'string' ? { src: video.captions, srclang: 'en', label: 'English' } : video?.captions;
  const demo = video?.src ? `<figure class="demo-video"><video controls playsinline preload="metadata"${video.poster ? ` poster="${escape(asset(video.poster))}"` : ''} aria-label="${escape(project.title)} demo"><source src="${escape(asset(video.src))}"${video.type ? ` type="${escape(video.type)}"` : ''}>${captions?.src ? `<track kind="captions" src="${escape(asset(captions.src))}" srclang="${escape(captions.srclang || 'en')}" label="${escape(captions.label || 'English')}" default>` : ''}Your browser does not support this video. <a href="${escape(asset(video.src))}">Download the demo video</a>.</video>${video.caption ? `<figcaption>${escape(video.caption)}</figcaption>` : ''}</figure>` : `<div class="media-placeholder video-placeholder">${videoIcon}<p>Demo video coming soon</p></div>`;
  return `<div class="project-media"><div>${photos}</div><div>${demo}</div></div>`;
}

function previewImage(project) {
  return project.images?.[0] ? imageMarkup(project.images[0], 'home-preview-image') : `<div class="media-placeholder photos-placeholder">${photoIcon}<p>Project photos coming soon</p></div>`;
}

function technologyList(project) {
  return project.technologies?.length ? `<ul class="tech-list" aria-label="Technologies used">${project.technologies.map((technology) => `<li>${escape(technology)}</li>`).join('')}</ul>` : '';
}

function projectDetail(project, experience) {
  return `<article class="detail-page wrap" aria-labelledby="project-title"><a class="text-link back-link" href="${escape(`${base}#projects`)}"><span aria-hidden="true">←</span> Back to Projects</a><header class="detail-intro"><p class="eyebrow">${escape(project.status || project.category)}</p><h1 id="project-title">${escape(project.title)}</h1><p class="project-summary">${escape(project.summary)}</p>${project.context ? `<p class="project-context">${escape(project.context)}</p>` : ''}${technologyList(project)}${project.repository || project.teamRepository ? `<div class="project-links">${project.repository ? `<a class="text-link" href="${escape(project.repository)}" aria-label="View ${escape(project.title)} repository on GitHub">View code on GitHub ${externalArrow}</a>` : ''}${project.teamRepository ? `<a class="text-link secondary-link" href="${escape(project.teamRepository)}">Team repository ${externalArrow}</a>` : ''}</div>` : ''}</header>${experience ? `<section class="internship-context" aria-labelledby="internship-role"><div><h2 id="internship-role">${escape(experience.role)} · ${escape(experience.organization)}</h2><p>${escape(experience.description)}</p></div><p class="date-label">${escape(experience.dates)}</p></section>` : ''}${project.award ? `<a class="award" href="${escape(project.award.url)}"><img class="award-logo" src="${escape(asset('assets/aisehack.webp'))}" width="256" height="256" alt="AISEHack" loading="lazy" decoding="async"><span><b>${escape(project.award.title)}</b><small>${escape(project.award.description)}</small></span>${externalArrow}</a>` : ''}${media(project)}${project.details?.length ? `<div class="case-details">${project.details.map((detail) => `<section><h2>${escape(detail.heading)}</h2><p>${escape(detail.text)}</p></section>`).join('')}</div>` : ''}</article>`;
}

const toolbox = site.toolbox || [];
const home = `<section class="home-band home-band-hero" id="about" tabindex="-1" aria-labelledby="home-title"><div class="home-hero wrap"><div class="home-copy"><p class="eyebrow">${escape(site.home.eyebrow)}</p><h1 id="home-title">${escape(site.shortName)}</h1><p class="home-role">${escape(site.home.role)}</p><p class="home-intro">${escape(site.home.intro)}</p><p class="hero-education"><span>${escape(site.education.institution)}</span><span>${escape(site.education.grade)}</span></p><a class="button button-primary" href="#projects">Explore projects ${arrow}</a><p class="availability"><span class="status-dot" aria-hidden="true"></span>${escape(site.home.availability)}</p></div><figure class="portrait"><img src="${escape(asset(site.portrait.src))}" alt="${escape(site.portrait.alt)}" width="${escape(site.portrait.width)}" height="${escape(site.portrait.height)}" fetchpriority="high" decoding="async"></figure><a class="hero-scroll" href="#skills"><span>Scroll to explore</span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></a></div></section>
<section class="home-band home-band-skills" id="skills" tabindex="-1" aria-labelledby="home-tools-title"><div class="home-skills wrap"><p class="eyebrow">Toolbox</p><h2 id="home-tools-title">What I build with</h2><div class="skills-table">${toolbox.map((group) => `<div class="skills-row"><h3>${escape(group.category)}</h3><ul class="skill-pills" aria-label="${escape(group.category)} tools">${group.items.map((item) => `<li class="skill-pill">${item.icon ? `<span class="skill-logo"><img src="${escape(asset(item.icon))}" alt="" width="24" height="24" loading="lazy" decoding="async"></span>` : ''}<span>${escape(item.name)}</span></li>`).join('')}</ul></div>`).join('')}</div></div></section>
<section class="home-band home-band-work" id="projects" tabindex="-1" aria-labelledby="home-work-title"><div class="wrap"><header class="home-work-heading"><p class="eyebrow">Projects & internship</p><h2 id="home-work-title">Selected work</h2><p>${escape(site.pages.projects.intro)}</p></header><section class="home-experience" aria-labelledby="home-experience-title"><div class="home-role-index"><p class="eyebrow">Internship</p><h3>${escape(site.experience.role)}</h3><p>${escape(site.experience.organization)}</p><p class="date-label">${escape(site.experience.dates)}</p></div><div class="home-experience-copy"><p class="eyebrow">Retrieval & backend development</p><h3 id="home-experience-title">${escape(site.experience.project.title)}</h3><p>${escape(site.experience.project.summary)}</p><a class="text-link" href="${escape(detailRoute(site.experience.project))}">Explore project ${arrow}</a></div></section><div class="home-project-list">${site.projects.map((project, index) => `<article class="home-project-preview${index % 2 ? ' is-reversed' : ''}">${previewImage(project)}<div class="home-project-copy"><p class="eyebrow">${escape(project.category)}</p><h3>${escape(project.title)}</h3><p class="preview-summary">${escape(project.summary)}</p><a class="text-link" href="${escape(detailRoute(project))}">Explore project ${arrow}</a></div></article>`).join('')}</div></div>${site.research ? `<section class="home-research-band" aria-labelledby="home-research-title"><div class="home-research wrap"><div><p class="eyebrow">${escape(site.research.status)}</p><h3 id="home-research-title">${escape(site.research.title)}</h3><p>${escape(site.research.summary)}</p></div><a class="text-link" href="${escape(detailRoute(site.research))}">Explore the research ${arrow}</a></div></section>` : ''}</section>
<section class="home-band home-band-end" id="contact" tabindex="-1" aria-labelledby="home-contact-title"><div class="home-contact wrap"><div><p class="eyebrow">Get in touch</p><h2 id="home-contact-title">Let's connect.</h2><p>${escape(site.contact.intro)}</p></div><div class="contact-links"><a class="contact-email" href="mailto:${escape(site.email)}"><span>${escape(site.email)}</span>${externalArrow}</a><div class="social-links"><a class="text-link" href="${escape(site.linkedin)}">LinkedIn ${externalArrow}</a><a class="text-link" href="${escape(site.github)}">GitHub ${externalArrow}</a></div></div></div></section>`;

const person = { '@context': 'https://schema.org', '@type': 'Person', name: site.name, url: `${origin}${base}`, email: `mailto:${site.email}`, sameAs: [site.github, site.linkedin], affiliation: { '@type': 'CollegeOrUniversity', name: site.education.institution } };
const projects = [site.experience.project, ...site.projects, ...(site.research ? [site.research] : [])];
const pages = [{ page: '', title: site.title, description: site.description, content: home, structuredData: person }, ...projects.map((project) => ({ page: `projects/${slugs[project.id] || project.id}`, title: `${project.title} — ${site.shortName}`, description: project.summary, content: projectDetail(project, project.id === 'copilot' ? site.experience : null) }))];

if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Refusing to clear a build directory outside the project root.');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
for (const page of pages) {
  const directory = path.join(dist, page.page);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), document(page));
}

const legacyMap = Object.fromEntries(projects.map((project) => [project.id, detailRoute(project)]));
if (site.research) legacyMap.research = detailRoute(site.research);
for (const legacy of [
  { page: 'about', target: `${base}#about`, canonicalPath: base },
  { page: 'projects', target: `${base}#projects`, canonicalPath: base, map: legacyMap },
  { page: 'internship', target: detailRoute(site.experience.project), canonicalPath: detailRoute(site.experience.project) }
]) {
  const script = legacy.map ? `(function(){var map=${JSON.stringify(legacy.map)},key;try{key=decodeURIComponent(location.hash.slice(1))}catch(e){}location.replace(map[key]||${JSON.stringify(legacy.target)})})();` : `location.replace(${JSON.stringify(legacy.target)})`;
  const content = `<section class="not-found wrap"><p class="eyebrow">Page moved</p><h1>This page has a new home.</h1><p>Continue to the updated portfolio.</p><a class="button button-primary" href="${escape(legacy.target)}">Continue ${arrow}</a></section>`;
  await mkdir(path.join(dist, legacy.page), { recursive: true });
  await writeFile(path.join(dist, legacy.page, 'index.html'), document({ ...legacy, title: `Page moved — ${site.shortName}`, description: 'Continue to the updated portfolio.', content, extraHead: `<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${escape(legacy.target)}"><script>${script}</script>` }));
}

const notFound = `<section class="not-found wrap"><p class="eyebrow">404 / Page not found</p><h1>Page not found.</h1><p>The page you were looking for isn't here. Explore my portfolio from the introduction.</p><a class="button button-primary" href="${escape(`${base}#about`)}">Back to portfolio ${arrow}</a></section>`;
await Promise.all([
  writeFile(path.join(dist, '404.html'), document({ page: '404', title: `Page not found — ${site.shortName}`, description: 'This page could not be found.', content: notFound, canonicalPath: `${base}404.html`, extraHead: '<meta name="robots" content="noindex">' })),
  writeFile(path.join(dist, '.nojekyll'), ''),
  writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap.xml\n`),
  writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(({ page }) => `<url><loc>${escape(`${origin}${route(page)}`)}</loc></url>`).join('')}</urlset>\n`)
]);
console.log(`Built ${pages.length} static pages and 3 legacy redirects for ${origin}${base}`);
