import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const base = config.basePath;
const origin = config.siteUrl;
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const definitions = [
  { name: 'Home', file: 'index.html', route: '' },
  { name: 'Copilot', file: 'projects/enterprise-knowledge-copilot/index.html', route: 'projects/enterprise-knowledge-copilot/', repository: config.experience.project.repository },
  { name: 'Forecasting', file: 'projects/pm25-forecasting-system/index.html', route: 'projects/pm25-forecasting-system/', repository: config.projects.find(x => x.id === 'forecasting').repository },
  { name: 'Hospital', file: 'projects/hospital-management-system/index.html', route: 'projects/hospital-management-system/', repository: config.projects.find(x => x.id === 'hospital').repository },
  { name: 'Research', file: 'projects/vl-jepa/index.html', route: 'projects/vl-jepa/' },
  { name: 'Legacy projects', file: 'projects/index.html', route: 'projects/', target: base + '#projects' },
  { name: 'Legacy about', file: 'about/index.html', route: 'about/', target: base + '#about' },
  { name: 'Legacy internship', file: 'internship/index.html', route: 'internship/', target: base + 'projects/enterprise-knowledge-copilot/' },
  { name: '404', file: '404.html', route: '404.html' }
];
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(x => [x[1].toLowerCase(), x[3].replaceAll('&amp;', '&')]));
const pages = [];
for (const definition of definitions) {
  try {
    const html = await readFile(path.join(dist, definition.file), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
    const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(x => attrs(x[0]));
    const links = [...html.matchAll(/<(?:a|link|img|script|source|video|track)\b[^>]*>/gi)].map(x => attrs(x[0]));
    pages.push({ ...definition, html, ids: new Set(ids), meta, links, url: new URL(base + definition.route, origin) });
    check(new Set(ids).size === ids.length, `${definition.name}: duplicate HTML IDs.`);
  } catch (error) { failures.push(`${definition.name}: ${error.message}`); }
}
const byFile = new Map(pages.map(p => [p.file, p]));
let resourceCount = 0;
async function resource(link, page) {
  if (!link || /^(mailto:|tel:|data:)/i.test(link)) return;
  if (/^(javascript|vbscript):/i.test(link)) { failures.push(`${page.name}: unsafe link`); return; }
  let url;
  try { url = new URL(link, page.url); } catch { failures.push(`${page.name}: malformed link ${link}`); return; }
  if (url.origin !== page.url.origin) return;
  check(url.pathname.startsWith(base), `${page.name}: link ignores base path ${link}`);
  if (!url.pathname.startsWith(base)) return;
  const target = path.resolve(dist, decodeURIComponent(url.pathname.slice(base.length)) || '.');
  if (target !== dist && !target.startsWith(dist + path.sep)) { failures.push('Resource escapes output'); return; }
  try {
    const info = await stat(target), file = info.isDirectory() ? path.join(target, 'index.html') : target;
    await stat(file);
    if (url.hash) {
      const destination = byFile.get(path.relative(dist, file).replaceAll('\\', '/'));
      check(destination?.ids.has(decodeURIComponent(url.hash.slice(1))), `${page.name}: broken anchor ${link}`);
    }
    resourceCount++;
  } catch { failures.push(`${page.name}: missing local resource ${link}`); }
}
const titles = new Set(), descriptions = new Set();
for (const page of pages) {
  const { html, meta, links, name } = page;
  const canonical = links.find(x => x.rel === 'canonical')?.href;
  if (page.target) {
    check(meta.some(x => x['http-equiv']?.toLowerCase() === 'refresh' && x.content?.includes(page.target)), `${name}: missing redirect.`);
    check(canonical && new URL(canonical).href === new URL(page.target.split('#')[0], origin).href, `${name}: wrong redirect canonical.`);
    check(links.some(x => x.href === page.target), `${name}: missing fallback link.`);
    for (const link of links) if (link.href) await resource(link.href, page);
    continue;
  }
  check((html.match(/<h1\b/gi) || []).length === 1, `${name}: one h1 required.`);
  check(/<html[^>]+lang="en"/.test(html), `${name}: language missing.`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = meta.find(x => x.name === 'description')?.content;
  check(title && !titles.has(title), `${name}: unique title required.`); titles.add(title);
  check(description && !descriptions.has(description), `${name}: unique description required.`); descriptions.add(description);
  check(canonical && new URL(canonical).href === page.url.href, `${name}: canonical mismatch.`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) check(meta.some(x => x.property === property && x.content), `${name}: ${property} missing.`);
  check(meta.some(x => x.name === 'twitter:card'), `${name}: sharing card missing.`);
  check(links.some(x => x.rel === 'icon'), `${name}: favicon missing.`);
  check(/<main\b[^>]*id="main"[^>]*tabindex="-1"/.test(html), `${name}: focusable main required.`);
  check(links.some(x => x.href === '#main'), `${name}: skip link missing.`);
  check(!/href="(?:#|javascript:[^"]*)"/.test(html), `${name}: empty placeholder link.`);
  check(!/9265324158|27(?:th)?\s+October\s+2005/.test(html), `${name}: private personal detail in HTML.`);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    const a = attrs(image[0]); check('alt' in a && a.width && a.height, `${name}: image alternative/dimensions missing.`);
  }
  for (const link of links) for (const attr of ['href','src','poster']) if (link[attr]) await resource(link[attr], page);
  if (name !== '404') {
    const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || '';
    for (const section of ['about','skills','projects','contact']) check(header.includes(`href="${base}#${section}"`), `${name}: missing ${section} navigation anchor.`);
    check(!/>Home<\/a>/.test(header), `${name}: old Home tab remains.`);
    check((html.match(/<a\b[^>]*href="[^"]*resume\.pdf"/g)||[]).length === 1, `${name}: one resume link required.`);
    check(/class="[^"]*theme-toggle/.test(header), `${name}: theme control missing.`);
  }
  if (name === 'Home') check((html.match(/href="mailto:/g)||[]).length === 1, 'Home: one contact email required.');
  else check(!/<a\b[^>]*href="mailto:/.test(html), `${name}: contact belongs at the end of Home.`);
  if (page.repository) check(html.includes(page.repository), `${name}: repository missing.`);
}
const home = pages.find(x => x.name === 'Home')?.html || '';
let lastPosition = -1;
for (const section of ['about','skills','projects','contact']) {
  const position = home.indexOf(`id="${section}"`); check(position > lastPosition, `Home: missing/out-of-order ${section}.`); lastPosition = position;
}
check(home.includes('assets/meet-patel.webp'), 'Home: portrait missing.');
check(/CGPA/.test(home) && !/through\s+semester/i.test(home), 'Home: education/CGPA missing or obsolete.');
for (const page of pages.filter(x => x.repository || x.name === 'Research')) check(home.includes(`href="${base}${page.route}"`), `Home: detail link to ${page.name} missing.`);
const research = pages.find(x => x.name === 'Research')?.html || '';
check(/ongoing/i.test(research) && /UCA/.test(research) && /SigLIP/.test(research), 'Research: verified ongoing description missing.');
check((pages.find(x => x.name === 'Forecasting')?.html || '').includes('assets/aisehack.webp'), 'Forecasting: award logo missing.');
const css = await readFile(path.join(dist,'site.css'),'utf8');
for (const [pattern,label] of [[/prefers-reduced-motion/,'reduced motion'],[/focus-visible/,'visible focus'],[/data-theme[^\n]*dark/,'dark theme'],[/prefers-color-scheme/,'system theme'],[/@font-face/,'local font']]) check(pattern.test(css), `CSS: missing ${label}.`);
for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) await resource(match[1],{...pages[0],name:'CSS',url:new URL(base+'site.css',origin)});
const sitemap = await readFile(path.join(dist,'sitemap.xml'),'utf8');
for (const page of pages.filter(x => !x.target && x.name !== '404')) check(sitemap.toLowerCase().includes(page.url.href.toLowerCase()), `Sitemap omits ${page.name}.`);
for (const file of ['404.html','robots.txt','.nojekyll']) await stat(path.join(dist,file)).catch(()=>failures.push(`Missing ${file}`));
if (failures.length) { console.error(failures.map(x=>'FAIL: '+x).join('\n')); process.exitCode=1; }
else console.log(`Static checks passed: homepage, four project details, legacy routes, ${resourceCount} local resources, anchor navigation, metadata, privacy, contact, focus and themes.`);
