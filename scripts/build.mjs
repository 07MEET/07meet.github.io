import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const externalArrow = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const downloadIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg>';
const photoIcon = '<svg viewBox="0 0 32 32" aria-hidden="true" class="media-icon"><rect x="4" y="5" width="24" height="22" rx="3"/><circle cx="12" cy="12" r="2"/><path d="m5 23 7-7 5 5 5-8 5 8"/></svg>';
const videoIcon = '<svg viewBox="0 0 32 32" aria-hidden="true" class="media-icon"><rect x="4" y="5" width="24" height="22" rx="3"/><path d="M10 5v22M22 5v22M4 11h6m-6 10h6M22 11h6m-6 10h6"/></svg>';
const monogram = '<svg class="wordmark-symbol" viewBox="0 0 40 36" fill="none" aria-hidden="true"><path d="M4 28V8l10 15L24 8v20M24 8h5a7 7 0 0 1 0 14h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const themeBootstrap = `<script>(function(){var theme;try{theme=localStorage.getItem('meet-portfolio-theme')}catch(e){}if(theme!=='light'&&theme!=='dark'){try{theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){theme='light'}}document.documentElement.dataset.theme=theme;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?'#1b2230':'#f7f8fc'})();</script>`;
const themeButton = `<button class="theme-toggle" type="button" aria-label="Dark theme" aria-pressed="false" title="Switch to dark theme"><svg class="icon theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 14.3A8.7 8.7 0 0 1 9.7 3.6 8.8 8.8 0 1 0 20.4 14.3Z"/></svg><svg class="icon theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg></button>`;
const resumePath = typeof site.resume === 'string' ? site.resume : site.resume?.file;
const navItems = [{ page: '', label: 'Home' }, { page: 'projects', label: 'Projects' }, { page: 'about', label: 'About' }];

function header(currentPage) {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header wrap">
    <div class="header-brand"><a class="wordmark" href="${escape(base)}" aria-label="${escape(site.shortName)}, home">${monogram}${escape(site.shortName)}</a>${themeButton}</div>
    <button class="nav-toggle" type="button" aria-label="Open navigation" aria-controls="site-nav" aria-expanded="false"><span>Menu</span><span class="menu-mark" aria-hidden="true"><i></i><i></i></span></button>
    <nav id="site-nav" class="site-nav" aria-label="Main navigation">
      <ul class="nav-links">${navItems.map(({ page, label }) => `<li><a href="${escape(route(page))}"${page === currentPage ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
      ${resumePath ? `<a class="resume-link" href="${escape(asset(resumePath))}" download aria-label="Download ${escape(site.shortName)}'s resume as a PDF">Resume ${downloadIcon}</a>` : ''}
    </nav>
  </header>`;
}

function head(title, description, page) {
  const redirect = `${route('projects')}#copilot`;
  const canonical = page === '404' ? `${origin}${base}404.html` : page === 'internship' ? `${origin}${route('projects')}` : `${origin}${route(page)}`;
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f7f8fc">
  ${themeBootstrap}
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${escape(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${escape(site.shortName)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${escape(canonical)}">
  <meta property="og:image" content="${escape(`${origin}${asset('assets/social.png')}`)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Meet Patel. AI/ML student, Python and SQL, Class of 2027.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(`${origin}${asset('assets/social.png')}`)}">
  <link rel="icon" type="image/svg+xml" href="${escape(asset('favicon.svg'))}">
  <link rel="preload" href="${escape(asset('assets/fonts/manrope.ttf'))}" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="${escape(asset('site.css'))}">
  <script src="${escape(asset('site.js'))}" defer></script>${page === '404' || page === 'internship' ? '\n  <meta name="robots" content="noindex">' : ''}${page === 'internship' ? `\n  <meta http-equiv="refresh" content="0;url=${escape(redirect)}"><script>location.replace(${JSON.stringify(redirect)})</script>` : ''}`;
}

const footer = `<footer class="site-footer wrap"><p>© ${new Date().getFullYear()} ${escape(site.name)}</p></footer>`;

function document(page, title, description, content, structuredData) {
  return `<!doctype html>
<html lang="en"><head>${head(title, description, page)}${structuredData ? `\n  <script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>` : ''}</head>
<body class="page-${page || 'home'}">${header(page)}<main id="main" tabindex="-1">${content}</main>${footer}</body></html>`;
}

function media(project) {
  const images = project.images || [];
  const photos = images.length ? `<div class="photo-gallery${images.length === 1 ? ' single-photo' : ''}">${images.map((image) => `<figure><img src="${escape(asset(image.src))}" alt="${escape(image.alt)}"${image.width ? ` width="${escape(image.width)}"` : ''}${image.height ? ` height="${escape(image.height)}"` : ''} loading="lazy" decoding="async">${image.caption ? `<figcaption>${escape(image.caption)}</figcaption>` : ''}</figure>`).join('')}</div>` : `<div class="media-placeholder photos-placeholder">${photoIcon}<p>Project photos coming soon</p></div>`;
  const video = project.video;
  const captions = typeof video?.captions === 'string' ? { src: video.captions, srclang: 'en', label: 'English' } : video?.captions;
  const demo = video?.src ? `<figure class="demo-video"><video controls playsinline preload="metadata"${video.poster ? ` poster="${escape(asset(video.poster))}"` : ''} aria-label="${escape(project.title)} demo"><source src="${escape(asset(video.src))}"${video.type ? ` type="${escape(video.type)}"` : ''}>${captions?.src ? `<track kind="captions" src="${escape(asset(captions.src))}" srclang="${escape(captions.srclang || 'en')}" label="${escape(captions.label || 'English')}" default>` : ''}Your browser does not support this video. <a href="${escape(asset(video.src))}">Download the demo video</a>.</video>${video.caption ? `<figcaption>${escape(video.caption)}</figcaption>` : ''}</figure>` : `<div class="media-placeholder video-placeholder">${videoIcon}<p>Demo video coming soon</p></div>`;
  return `<div class="project-media"><div class="media-photos">${photos}</div><div class="media-demo">${demo}</div></div>`;
}

function projectCase(project, index, experience = null) {
  return `<article class="project-case" id="${escape(project.id)}" aria-labelledby="${escape(project.id)}-title">
    <div class="project-heading"><p class="eyebrow">${escape(project.category)}</p><span class="project-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span></div>
    <h2 id="${escape(project.id)}-title">${escape(project.title)}</h2>
    <p class="project-summary">${escape(project.summary)}</p>
    ${experience ? `<div class="internship-context"><div><h3>${escape(experience.role)} · ${escape(experience.organization)}</h3><p>${escape(experience.description)}</p></div><p class="date-label">${escape(experience.dates)}</p></div>` : ''}
    ${project.context ? `<p class="project-context">${escape(project.context)}</p>` : ''}
    <ul class="tech-list" aria-label="Technologies used">${project.technologies.map((technology) => `<li>${escape(technology)}</li>`).join('')}</ul>
    <div class="project-links"><a class="text-link" href="${escape(project.repository)}" aria-label="View ${escape(project.title)} repository on GitHub">View code ${externalArrow}</a>${project.teamRepository ? `<a class="text-link secondary-link" href="${escape(project.teamRepository)}">Team repository ${externalArrow}</a>` : ''}</div>
    ${project.award ? `<a class="award" href="${escape(project.award.url)}"><img class="award-logo" src="${escape(asset('assets/aisehack.webp'))}" width="256" height="256" alt="AISEHack" loading="lazy" decoding="async"><span><b>${escape(project.award.title)}</b><small>${escape(project.award.description)}</small></span>${externalArrow}</a>` : ''}
    ${media(project)}
    <div class="case-details">${project.details.map((detail) => `<section><h3>${escape(detail.heading)}</h3><p>${escape(detail.text)}</p></section>`).join('')}</div>
  </article>`;
}

const home = `<section class="home-hero wrap" aria-labelledby="home-title">
  <div class="home-copy"><p class="eyebrow">${escape(site.home.eyebrow)}</p><h1 id="home-title">${escape(site.shortName)}</h1><p class="home-role">${escape(site.home.role)}</p><p class="home-intro">${escape(site.home.intro)}</p><a class="button button-primary" href="${escape(route('projects'))}">Explore projects ${arrow}</a><p class="availability"><span class="status-dot" aria-hidden="true"></span>${escape(site.home.availability)}</p></div>
  <figure class="portrait"><img src="${escape(asset(site.portrait.src))}" alt="${escape(site.portrait.alt)}" width="${escape(site.portrait.width)}" height="${escape(site.portrait.height)}" fetchpriority="high" decoding="async"></figure>
</section>
<section class="home-tools wrap" aria-labelledby="home-tools-title"><h2 id="home-tools-title">Tools I build with</h2><div class="tool-groups">${[{ title: 'Models', project: site.projects.find((item) => item.id === 'forecasting') }, { title: 'Retrieval', project: site.experience.project }, { title: 'Data', project: site.projects.find((item) => item.id === 'hospital') }].map(({ title, project }) => `<div class="tool-group"><h3>${title}</h3><p>${project.technologies.map(escape).join(' · ')}</p></div>`).join('')}</div></section>
<section class="home-experience wrap" aria-labelledby="home-experience-title"><div class="home-role-index"><p class="eyebrow">Internship</p><h2 id="home-experience-title">${escape(site.experience.role)}</h2><p>${escape(site.experience.organization)}</p><p class="date-label">${escape(site.experience.dates)}</p></div><div class="home-experience-copy"><p class="eyebrow">Retrieval & backend development</p><h3>${escape(site.experience.project.title)}</h3><p>${escape(site.experience.project.summary)}</p><a class="text-link" href="${escape(`${route('projects')}#copilot`)}">View internship project ${arrow}</a></div></section>
<section class="home-work wrap" aria-labelledby="home-work-title"><div class="home-section-heading"><div><p class="eyebrow">Selected projects</p><h2 id="home-work-title">Models, databases, and applications.</h2></div><a class="text-link" href="${escape(route('projects'))}">All projects ${arrow}</a></div><div class="home-project-list">${site.projects.map((project, index) => `<article class="home-project-preview${index % 2 ? ' is-reversed' : ''}"><div class="media-placeholder photos-placeholder">${photoIcon}<p>Project photos coming soon</p></div><div class="home-project-copy"><p class="eyebrow">${escape(project.category)}</p><h3>${escape(project.title)}</h3><p class="preview-summary">${escape(project.summary)}</p><a class="text-link" href="${escape(`${route('projects')}#${project.id}`)}">Explore project ${arrow}</a></div></article>`).join('')}</div></section>
${site.research ? `<section class="home-research wrap" aria-labelledby="home-research-title"><div><p class="eyebrow">${escape(site.research.status)}</p><h2 id="home-research-title">${escape(site.research.title)}</h2><p>${escape(site.research.summary)}</p></div><a class="text-link" href="${escape(`${route('projects')}#research`)}">Explore the research ${arrow}</a></section>` : ''}
<div class="home-about-link wrap"><p>Education, capabilities, and ways to connect.</p><a class="text-link" href="${escape(route('about'))}">About & contact ${arrow}</a></div>`;

const research = site.research ? `<section class="research-section" id="research" aria-labelledby="research-title"><p class="eyebrow">${escape(site.research.status)}</p><h2 id="research-title">${escape(site.research.title)}</h2><div id="${escape(site.research.id)}"><p class="research-summary">${escape(site.research.summary)}</p>${site.research.context ? `<p class="project-context">${escape(site.research.context)}</p>` : ''}${site.research.technologies?.length ? `<ul class="tech-list" aria-label="Research technologies">${site.research.technologies.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>` : ''}${site.research.details?.length ? `<div class="case-details">${site.research.details.map((detail) => `<section><h3>${escape(detail.heading)}</h3><p>${escape(detail.text)}</p></section>`).join('')}</div>` : ''}${site.research.repository ? `<a class="text-link research-link" href="${escape(site.research.repository)}">Research repository ${externalArrow}</a>` : ''}</div></section>` : '';

const projects = `<div class="page-content wrap"><header class="page-intro"><p class="eyebrow">Selected work</p><h1>Projects</h1><p>${escape(site.pages.projects.intro)}</p><nav class="project-jumps" aria-label="On this page"><a href="#copilot">Knowledge Copilot</a><a href="#forecasting">Forecasting</a><a href="#hospital">Database application</a>${site.research ? '<a href="#research">Research</a>' : ''}</nav></header><div class="project-list">${projectCase(site.experience.project, 0, site.experience)}${site.projects.map((project, index) => projectCase(project, index + 1)).join('')}</div>${research}</div>`;

const internship = `<section class="not-found wrap"><p class="eyebrow">Internship work</p><h1>Now part of Projects.</h1><p>My Supreet Chemicals internship and Enterprise Knowledge Copilot are together with my selected work.</p><a class="button button-primary" href="${escape(`${route('projects')}#copilot`)}">View internship project ${arrow}</a></section>`;

const about = `<div class="page-content wrap"><header class="page-intro"><p class="eyebrow">Background & contact</p><h1>About me</h1></header><div class="about-overview"><p class="about-intro">${escape(site.about.intro)}</p><section class="education" aria-labelledby="education-title"><p class="eyebrow">Education</p><h2 id="education-title">${escape(site.education.degree)}</h2><p class="institution">${escape(site.education.institution)}</p><p class="school">${escape(site.education.school)}</p><p class="date-label">${escape(site.education.dates)}</p><p class="education-grade">${escape(site.education.grade)}</p></section></div><section class="capabilities" aria-labelledby="capabilities-title"><div class="section-heading"><p class="eyebrow">Where I work</p><h2 id="capabilities-title">Capabilities</h2></div><div class="capability-list">${site.about.capabilities.map((capability) => `<div class="capability"><div><h3>${escape(capability.title)}</h3><p>${escape(capability.description)}</p></div><a class="text-link" href="${escape(`${route(capability.page)}#${capability.project}`)}">${escape(capability.linkLabel)} ${arrow}</a></div>`).join('')}</div></section><section class="contact-section" aria-labelledby="contact-title"><div class="section-heading"><p class="eyebrow">Get in touch</p><h2 id="contact-title">Contact</h2><p>${escape(site.contact.intro)}</p></div><div class="contact-links"><a class="contact-email" href="mailto:${escape(site.email)}">${escape(site.email)} ${externalArrow}</a><div class="social-links"><a class="text-link" href="${escape(site.linkedin)}">LinkedIn ${externalArrow}</a><a class="text-link" href="${escape(site.github)}">GitHub ${externalArrow}</a></div></div></section></div>`;

const person = { '@context': 'https://schema.org', '@type': 'Person', name: site.name, url: `${origin}${base}`, email: `mailto:${site.email}`, sameAs: [site.github, site.linkedin], affiliation: { '@type': 'CollegeOrUniversity', name: site.education.institution } };
const pages = [
  { page: '', title: site.title, description: site.description, content: home },
  { page: 'projects', ...site.pages.projects, content: projects },
  { page: 'about', ...site.pages.about, content: about, structuredData: person }
];

if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Refusing to clear a build directory outside the project root.');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
for (const page of pages) {
  const directory = path.join(dist, page.page);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), document(page.page, page.title, page.description, page.content, page.structuredData));
}
await mkdir(path.join(dist, 'internship'), { recursive: true });
await writeFile(path.join(dist, 'internship/index.html'), document('internship', 'Internship work — Meet Patel', 'Internship work is now part of the Projects page.', internship));
const notFound = `<section class="not-found wrap"><p class="eyebrow">404 / Page not found</p><h1>Page not found.</h1><p>The page you were looking for isn't here. You can explore my portfolio from the home page.</p><a class="button button-primary" href="${escape(base)}">Back to home ${arrow}</a></section>`;
await Promise.all([
  writeFile(path.join(dist, '404.html'), document('404', `Page not found — ${site.shortName}`, 'This page could not be found.', notFound)),
  writeFile(path.join(dist, '.nojekyll'), ''),
  writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap.xml\n`),
  writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(({ page }) => `<url><loc>${escape(`${origin}${route(page)}`)}</loc></url>`).join('')}</urlset>\n`)
]);
console.log(`Built ${pages.length} static pages for ${origin}${base}`);
