import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const dist = path.join(root, 'dist');
const base = `/${String(site.basePath || '/').split('/').filter(Boolean).join('/')}${String(site.basePath || '/').split('/').filter(Boolean).length ? '/' : ''}`;
const url = `${site.siteUrl.replace(/\/$/, '')}${base}`;
const asset = (file) => `${base}${String(file).replace(/^\/+/, '')}`;
const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const externalArrow = '<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const resumePath = typeof site.resume === 'string' ? site.resume : site.resume?.file;
const resumeLink = resumePath ? `<a class="text-link resume-link" href="${escape(asset(resumePath))}" download aria-label="Download ${escape(site.shortName)}'s resume as a PDF">Download resume ${arrow}</a>` : '';

const head = (title, description, canonical = url) => `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#F7F5F0">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${escape(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${escape(site.shortName)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${escape(canonical)}">
  <meta property="og:image" content="${escape(`${site.siteUrl.replace(/\/$/, '')}${asset('assets/social.png')}`)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Meet Patel. Building with data, from search to forecasting.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(`${site.siteUrl.replace(/\/$/, '')}${asset('assets/social.png')}`)}">
  <link rel="icon" type="image/svg+xml" href="${escape(asset('favicon.svg'))}">
  <link rel="stylesheet" href="${escape(asset('site.css'))}">
  <script src="${escape(asset('site.js'))}" defer></script>`;

const header = `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header wrap">
  <a class="wordmark" href="${escape(base)}" aria-label="${escape(site.shortName)}, home"><span class="wordmark-symbol" aria-hidden="true">m.</span>${escape(site.shortName)}</a>
  <button class="nav-toggle" type="button" aria-label="Open navigation" aria-controls="site-nav" aria-expanded="false"><span>Menu</span><span class="menu-mark" aria-hidden="true"><i></i><i></i></span></button>
  <nav id="site-nav" class="site-nav" aria-label="Main navigation"><a href="${escape(base)}#work">Work</a><a href="${escape(base)}#about">About</a><a href="${escape(base)}#contact">Contact ${externalArrow}</a></nav>
</header>`;

const heroMap = `<div class="hero-map" aria-hidden="true">
  <div class="map-topline"><span>WAYS OF WORKING</span><span>01—03</span></div>
  <div class="map-core"><span class="map-core-dot"></span><span>Data</span><small>A starting point.</small></div>
  <svg class="map-paths" viewBox="0 0 420 350" fill="none"><path d="M89 148H179Q195 148 195 132V95Q195 77 214 77H289M195 148V195Q195 213 214 213H289M195 195V284Q195 303 214 303H289" stroke="currentColor" stroke-width="1.5"/><circle cx="195" cy="148" r="4" fill="currentColor"/><path d="m283 71 6 6-6 6m0 124 6 6-6 6m0 84 6 6-6 6" stroke="currentColor" stroke-width="1.5"/></svg>
  <div class="map-node map-node-search"><span class="map-node-number">01</span><span><b>Find the context</b><small>Document retrieval</small></span></div>
  <div class="map-node map-node-model"><span class="map-node-number">02</span><span><b>Look ahead</b><small>Pollution forecasting</small></span></div>
  <div class="map-node map-node-db"><span class="map-node-number">03</span><span><b>Connect the records</b><small>Database applications</small></span></div>
  <div class="map-bottomline"><span>PYTHON + SQL</span><span>A MAP OF MY WORK ↗</span></div>
</div>`;

const projectImages = {
  copilot: { file: 'copilot.svg', alt: 'Simplified copilot workflow: source documents are ingested, hybrid search retrieves context, and answers include source-page citations.', caption: 'Architecture illustration · documents to cited answers' },
  forecasting: { file: 'forecasting.svg', alt: 'Conceptual forecasting illustration showing a spatial input grid and future time steps. The drawn curve is illustrative, not measured model output.', caption: 'Concept illustration · schematic forecasting data' },
  hospital: { file: 'hospital.svg', alt: 'Simplified relational illustration linking patient records, appointments, and billing and reporting workflows.', caption: 'Schema illustration · connected records and workflows' }
};

function projectCard(project, index) {
  const graphic = projectImages[project.id];
  return `<article class="project project-${escape(project.id)} ${index === 0 ? 'project-featured' : ''}" id="${escape(project.id)}">
  <div class="project-index" aria-hidden="true">${escape(project.number)}</div>
  <div class="project-main">
    <div class="project-layout">
      <figure class="project-figure"><div class="project-image-frame"><img src="${escape(asset(`assets/${graphic.file}`))}" width="${index ? '660' : '720'}" height="${index ? '420' : '460'}" alt="${escape(graphic.alt)}" loading="lazy" decoding="async"></div><figcaption>${escape(graphic.caption)}</figcaption></figure>
      <div class="project-copy">
        <p class="eyebrow project-category">${escape(project.category)}</p>
        <h3>${escape(project.title)}</h3>
        <p class="project-summary">${escape(project.summary)}</p>
        <p class="project-context">${escape(project.context)}</p>
        <ul class="tech-list" aria-label="Technologies used">${project.technologies.map((technology) => `<li>${escape(technology)}</li>`).join('')}</ul>
        ${project.award ? `<a class="award" href="${escape(project.award.url)}"><svg class="award-symbol" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 2.3 5 5.5.7-4 4 .9 5.6-4.7-2.6-4.7 2.6.9-5.6-4-4 5.5-.7L12 2Z"/><path d="m8 17-1 5 5-2 5 2-1-5"/></svg><span><b>${escape(project.award.title)}</b><small>${escape(project.award.description)}</small></span>${externalArrow}</a>` : ''}
        <div class="project-links"><a class="text-link" href="${escape(project.repository)}" aria-label="View ${escape(project.title)} repository on GitHub">View repository ${externalArrow}</a>${project.teamRepository ? `<a class="text-link secondary-link" href="${escape(project.teamRepository)}">Team repository ${externalArrow}</a>` : ''}</div>
      </div>
    </div>
    <div class="project-meta"><ul class="project-highlights" aria-label="Project highlights">${project.highlights.map((highlight) => `<li>${escape(highlight)}</li>`).join('')}</ul></div>
    <details class="project-details"><summary><span>Inside the project</span><span class="detail-plus" aria-hidden="true"></span></summary><div class="detail-content">${project.details.map((detail) => `<div><h4>${escape(detail.heading)}</h4><p>${escape(detail.text)}</p></div>`).join('')}</div></details>
  </div>
</article>`;
}

const structuredData = { '@context': 'https://schema.org', '@type': 'Person', name: site.name, url, email: `mailto:${site.email}`, sameAs: [site.github, site.linkedin], affiliation: { '@type': 'CollegeOrUniversity', name: site.education.institution } };

const html = `<!doctype html>
<html lang="en">
<head>${head(site.title, site.description)}
  <script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>
</head>
<body>
${header}
<main id="main" tabindex="-1">
  <section class="hero wrap" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow hero-eyebrow"><span class="tiny-line" aria-hidden="true"></span>${escape(site.name)}</p>
      <h1 id="hero-title">${escape(site.hero.headline)} <em>${escape(site.hero.emphasis)}</em></h1>
      <p class="hero-intro">${escape(site.hero.intro)}</p>
      <p class="hero-descriptor">${escape(site.hero.eyebrow)}</p>
      <div class="hero-actions"><a class="button button-primary" href="#work">View selected work ${arrow}</a>${resumePath ? resumeLink : `<a class="text-link" href="#contact">Get in touch ${externalArrow}</a>`}</div>
    </div>
    ${heroMap}
    <div class="hero-foot"><p><span class="status-dot" aria-hidden="true"></span>${escape(site.hero.availability)}</p><a href="#work" class="scroll-note">A little further down <span aria-hidden="true">↓</span></a></div>
  </section>

  <section class="work-section wrap" id="work" aria-labelledby="work-title">
    <div class="section-header"><div><p class="eyebrow">Selected work / ${String(site.projects.length).padStart(2, '0')}</p><h2 id="work-title">A few things I've built.</h2></div><p class="section-intro">Document retrieval, spatial forecasting,<br>and SQL workflows.</p></div>
    ${site.projects.map(projectCard).join('\n')}
  </section>

  <section class="experience-section wrap" id="experience" aria-labelledby="experience-title">
    <div class="section-side"><p class="eyebrow">Experience</p><h2 id="experience-title">Learning<br>in practice.</h2></div>
    <div class="experience-content"><div class="experience-heading"><div><h3>${escape(site.experience.role)}</h3><p class="organization">${escape(site.experience.organization)}</p></div><p class="date-label">${escape(site.experience.dates)}</p></div><p class="experience-description">${escape(site.experience.description)}</p><p class="experience-contribution">${escape(site.experience.contribution)}</p><a href="#${escape(site.experience.project)}" class="text-link">Explore the project ${arrow}</a></div>
  </section>

  <section class="about-section wrap" id="about" aria-labelledby="about-title">
    <div class="about-top"><div class="section-side"><p class="eyebrow">A little about me</p><h2 id="about-title">Working across<br><em>models and data.</em></h2></div><div class="about-intro"><p>${escape(site.about.intro)}</p>${resumeLink}</div></div>
    <div class="capabilities">${site.about.capabilities.map((capability, index) => `<div class="capability"><span class="capability-index" aria-hidden="true">0${index + 1}</span><h3>${escape(capability.title)}</h3><p>${escape(capability.description)}</p><a class="text-link" href="#${escape(capability.project)}">${escape(capability.linkLabel)} ${arrow}</a></div>`).join('')}</div>
    <div class="education"><p class="eyebrow">Education</p><div><h3>${escape(site.education.degree)}</h3><p>${escape(site.education.institution)} <span class="education-school">· ${escape(site.education.school)}</span></p><p class="education-grade">${escape(site.education.grade)}</p></div><p class="date-label">${escape(site.education.dates)}</p></div>
  </section>

  <section class="contact-section" id="contact" aria-labelledby="contact-title"><div class="wrap contact-inner"><div><p class="eyebrow">Next chapter</p><h2 id="contact-title">${escape(site.contact.headline)}<br><em>${escape(site.contact.emphasis)}</em></h2><p class="contact-intro">${escape(site.contact.intro)}</p></div><div class="contact-actions"><a class="contact-email" href="mailto:${escape(site.email)}"><span>Say hello</span>${externalArrow}</a><a class="email-address" href="mailto:${escape(site.email)}">${escape(site.email)}</a><div class="contact-socials"><a class="text-link" href="${escape(site.linkedin)}">LinkedIn ${externalArrow}</a><a class="text-link" href="${escape(site.github)}">GitHub ${externalArrow}</a></div>${resumeLink}</div></div></section>
</main>
<footer class="site-footer wrap"><p>© ${new Date().getFullYear()} ${escape(site.name)}</p><p>AI/ML & data systems</p><a href="#main" class="back-top">Back to top <span aria-hidden="true">↑</span></a></footer>
</body>
</html>`;

const notFound = `<!doctype html><html lang="en"><head>${head(`Page not found — ${site.shortName}`, 'This page could not be found.', `${url}404.html`)}<meta name="robots" content="noindex"></head><body>${header}<main class="not-found wrap" id="main"><p class="eyebrow">404 / Page not found</p><h1>A small detour.</h1><p>The page you were looking for isn't here. My selected work is a good place to start.</p><a class="button button-primary" href="${escape(base)}#work">Back to selected work ${arrow}</a></main></body></html>`;

if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') {
  throw new Error('Refusing to clear a build directory outside the project root.');
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
await Promise.all([
  writeFile(path.join(dist, 'index.html'), html),
  writeFile(path.join(dist, '404.html'), notFound),
  writeFile(path.join(dist, '.nojekyll'), ''),
  writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${url}sitemap.xml\n`),
  writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(url)}</loc></url></urlset>\n`)
]);
console.log(`Built ${site.projects.length} selected projects into dist/ for ${url}`);
