import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const base = config.basePath ?? config.site?.basePath ?? '/portfolio/';
const failures = [];
const requireCheck = (condition, message) => { if (!condition) failures.push(message); };
requireCheck(base.startsWith('/') && base.endsWith('/'), 'Pages basePath must begin and end with /.');
const origin = config.siteUrl ?? config.site?.siteUrl ?? 'https://07MEET.github.io';
const pageDefinitions = [
  { name: 'Home', file: 'index.html', route: '' },
  { name: 'Projects', file: 'projects/index.html', route: 'projects/' },
  { name: 'Legacy internship', file: 'internship/index.html', route: 'internship/', redirect: true },
  { name: 'About', file: 'about/index.html', route: 'about/' },
  { name: '404', file: '404.html', route: '404.html' }
];
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(x => [x[1].toLowerCase(), x[3].replaceAll('&amp;', '&')]));
const pages = [];
for (const definition of pageDefinitions) {
  try {
    const html = await readFile(path.join(dist, definition.file), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
    const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(x => attrs(x[0]));
    const links = [...html.matchAll(/<(?:a|link|img|script|source)\b[^>]*>/gi)].map(x => attrs(x[0]));
    pages.push({ ...definition, html, ids: new Set(ids), meta, links, url: new URL(base + definition.route, origin) });
    requireCheck(new Set(ids).size === ids.length, `${definition.name}: duplicate HTML IDs.`);
  } catch (error) { failures.push(`${definition.name}: cannot read generated ${definition.file}: ${error.message}`); }
}
const pageByFile = new Map(pages.map(page => [page.file.replaceAll('\\', '/'), page]));
const pageTitles = new Set();
const descriptions = new Set();
let localCount = 0;
async function checkResource(link, page) {
  if (!link || /^(mailto:|tel:|data:)/i.test(link)) return;
  if (!/^(https?:|\/|\.|#|[\w%-])/i.test(link) || /^(javascript|vbscript):/i.test(link)) { failures.push(`${page.name}: unsafe resource ${link}`); return; }
  let url;
  try { url = new URL(link, page.url); } catch { failures.push(`${page.name}: invalid URL ${link}`); return; }
  if (url.origin !== page.url.origin) return;
  requireCheck(url.pathname.startsWith(base), `${page.name}: resource ignores Pages base path: ${link}`);
  if (!url.pathname.startsWith(base)) return;
  let relative;
  try { relative = decodeURIComponent(url.pathname.slice(base.length)); } catch { failures.push(`${page.name}: malformed resource encoding: ${link}`); return; }
  const target = path.resolve(dist, relative || '.');
  requireCheck(target === dist || target.startsWith(dist + path.sep), `${page.name}: resource escapes output: ${link}`);
  if (target !== dist && !target.startsWith(dist + path.sep)) return;
  try {
    const info = await stat(target);
    const file = info.isDirectory() ? path.join(target, 'index.html') : target;
    if (info.isDirectory()) await stat(file);
    if (url.hash) {
      const destination = pageByFile.get(path.relative(dist, file).replaceAll('\\', '/'));
      const fragment = decodeURIComponent(url.hash.slice(1));
      requireCheck(Boolean(destination?.ids.has(fragment)), `${page.name}: broken cross-page anchor: ${link}`);
    }
    localCount++;
  } catch { failures.push(`${page.name}: missing local resource: ${link}`); }
}
for (const page of pages) {
  const { html, name, meta, links } = page;
  if (page.redirect) {
    const target = new URL(base + 'projects/#copilot', origin).href;
    const canonical = links.find(x => x.rel === 'canonical')?.href;
    requireCheck(Boolean(canonical) && new URL(canonical).href === target.split('#')[0], 'Legacy internship: canonical must point to Projects.');
    requireCheck(meta.some(x => x['http-equiv']?.toLowerCase() === 'refresh' && /^\s*0\s*;\s*url\s*=/i.test(x.content ?? '') && x.content?.includes(base + 'projects/#copilot')), 'Legacy internship: missing immediate redirect to Projects#copilot.');
    requireCheck(links.some(x => { try { return Boolean(x.href) && new URL(x.href, page.url).href === target; } catch { return false; } }), 'Legacy internship: missing usable fallback link.');
    for (const link of links) if (link.href) await checkResource(link.href, page);
    continue;
  }
  requireCheck((html.match(/<h1\b/gi) || []).length === 1, `${name}: exactly one h1 required.`);
  requireCheck(/<html[^>]+lang="en"/i.test(html), `${name}: declare the page language.`);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  requireCheck(Boolean(title) && !pageTitles.has(title), `${name}: missing or duplicate page title.`);
  pageTitles.add(title);
  const description = meta.find(x => x.name === 'description')?.content;
  requireCheck(Boolean(description) && !descriptions.has(description), `${name}: missing or duplicate description.`);
  descriptions.add(description);
  const canonical = links.find(x => x.rel === 'canonical')?.href;
  requireCheck(Boolean(canonical), `${name}: missing canonical URL.`);
  if (canonical && name !== '404') requireCheck(new URL(canonical).href === page.url.href, `${name}: canonical does not match actual route.`);
  requireCheck(meta.some(x => x.property === 'og:title' && x.content), `${name}: missing social title.`);
  requireCheck(meta.some(x => x.property === 'og:description' && x.content), `${name}: missing social description.`);
  requireCheck(meta.some(x => x.property === 'og:url' && x.content), `${name}: missing social URL.`);
  const socialImage = meta.find(x => x.property === 'og:image')?.content;
  requireCheck(Boolean(socialImage), `${name}: missing social sharing image.`);
  if (socialImage) await checkResource(socialImage, page);
  requireCheck(meta.some(x => x.name === 'twitter:card' && x.content), `${name}: missing social sharing card.`);
  requireCheck(links.some(x => x.rel === 'icon' && x.href), `${name}: missing favicon.`);
  const skip = links.find(x => /^#(?:main|main-content|content)$/.test(x.href ?? ''));
  requireCheck(Boolean(skip), `${name}: missing skip-to-content link.`);
  requireCheck((html.match(/<main\b/gi) || []).length === 1, `${name}: exactly one main landmark required.`);
  requireCheck(/<main\b[^>]*tabindex="-1"/.test(html), `${name}: skip destination must accept focus.`);
  requireCheck(/<nav\b[^>]*aria-label="[^"]+"/.test(html), `${name}: missing named navigation.`);
  requireCheck(!/9265324158|27(?:th)?\s+October\s+2005/.test(html), `${name}: private phone/date of birth found in HTML.`);
  requireCheck(!/href="(?:#|javascript:[^"]*)"/i.test(html), `${name}: placeholder or unsafe link.`);
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    const imageAttrs = attrs(image[0]);
    requireCheck('alt' in imageAttrs, `${name}: image without alternative text.`);
    requireCheck(Boolean(imageAttrs.width && imageAttrs.height), `${name}: image without explicit dimensions.`);
  }
  for (const link of links) {
    if (link.href) await checkResource(link.href, page);
    if (link.src) await checkResource(link.src, page);
  }
  if (name !== '404') {
    const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] ?? '';
    requireCheck(/<svg\b[^>]*class="[^"]*\bwordmark-symbol\b/.test(header), `${name}: missing SVG brand mark.`);
    const resumeLinks = [...html.matchAll(/<a\b[^>]*href="[^"]*resume\.pdf"[^>]*>/gi)];
    requireCheck(resumeLinks.length === 1, `${name}: require one resume link.`);
    requireCheck(/<a\b[^>]*href="[^"]*resume\.pdf"/.test(header), `${name}: resume link must be in shared header.`);
    for (const route of ['', 'projects/', 'about/']) {
      requireCheck(header.includes(`href="${base + route}"`), `${name}: missing header route ${base + route}`);
    }
    requireCheck(!header.includes(`href="${base}internship/"`), `${name}: legacy Internship should not appear in navigation.`);
    requireCheck(/<button\b[^>]*class="[^"]*\btheme-toggle\b/.test(header), `${name}: missing accessible theme control.`);
  }
  if (name === 'About') requireCheck(html.includes(`mailto:${config.email ?? 'meetpatel132465@gmail.com'}`), 'About: missing approved public email link.');
  else requireCheck(!/<a\b[^>]*href="mailto:/i.test(html), `${name}: contact email should be on About only.`);
  if (name !== 'Projects') requireCheck(!html.includes('https://github.com/07MEET/enterprise-knowledge-copilot'), `${name}: Enterprise Knowledge Copilot belongs on Projects only.`);
}
const projects = pages.find(x => x.name === 'Projects')?.html ?? '';
for (const repo of ['enterprise-knowledge-copilot', 'pm25-forecasting-system', 'hospital-management-system']) requireCheck(projects.includes(`https://github.com/07MEET/${repo}`), `Projects: missing repository ${repo}.`);
requireCheck(projects.match(/<article\b[^>]*\bid="([^"]+)"/)?.[1] === 'copilot', 'Projects: Enterprise Knowledge Copilot must be the first case study.');
requireCheck(/\bid="research"/.test(projects), 'Projects: missing linkable Research section.');
requireCheck(/VL[\s-]?JEPA/i.test(projects) && /ongoing/i.test(projects), 'Projects: VL-JEPA research must be labeled as ongoing.');
requireCheck(projects.includes('assets/aisehack.webp'), 'Projects: missing supplied AISEHack award photo.');
const about = pages.find(x => x.name === 'About')?.html ?? '';
requireCheck(/CGPA/.test(about) && !/through\s+semester|semester\s+6/i.test(about), 'About: show CGPA without the old semester qualifier.');
requireCheck((pages.find(x => x.name === 'Home')?.html ?? '').includes('assets/meet-patel.webp'), 'Home: missing supplied portrait.');
for (const file of ['404.html', 'robots.txt', 'sitemap.xml']) {
  try { await stat(path.join(dist, file)); } catch { failures.push(`Missing generated ${file}.`); }
}
const css = await readFile(path.join(dist, 'site.css'), 'utf8').catch(() => '');
requireCheck(/prefers-reduced-motion/.test(css), 'Missing reduced-motion support.');
requireCheck(/focus-visible/.test(css), 'Missing visible keyboard focus style.');
requireCheck(/data-theme[^\n]*dark/.test(css), 'Missing dark theme styles.');
requireCheck(/prefers-color-scheme/.test(css), 'Missing system colour preference fallback.');
requireCheck(/@font-face/.test(css) && /manrope/i.test(css), 'Missing self-hosted Manrope font declaration.');
for (const resource of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) await checkResource(resource[1], { ...pages[0], name: 'CSS', url: new URL(base + 'site.css', origin) });
try {
  const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
  for (const page of pages.filter(x => x.name !== '404' && !x.redirect)) requireCheck(sitemap.toLowerCase().includes(page.url.href.toLowerCase()), `Sitemap omits ${page.name}.`);
  requireCheck(!sitemap.toLowerCase().includes(new URL(base + 'internship/', origin).href.toLowerCase()), 'Sitemap should not include the legacy redirect.');
} catch {}
if (failures.length) {
  console.error(failures.map(x => `FAIL: ${x}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Static checks passed: 3 pages, legacy redirect, 404, unique metadata, shared navigation, privacy, ${localCount} local resources, cross-page anchors, selected work/research, portrait/font assets, themes, focus and reduced motion.`);
}
