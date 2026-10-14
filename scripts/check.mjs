import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const base = config.basePath ?? config.site?.basePath ?? '/portfolio/';
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const failures = [];
const requireCheck = (condition, message) => { if (!condition) failures.push(message); };

requireCheck((html.match(/<h1\b/gi) || []).length === 1, 'Homepage must have one h1.');
requireCheck(/<html[^>]+lang="en"/.test(html), 'Declare the page language.');
requireCheck(/<title>[^<]+<\/title>/.test(html), 'Missing page title.');
requireCheck(/<meta\s+[^>]*name="description"[^>]*content="[^"]+"/.test(html), 'Missing page description.');
requireCheck(/property="og:image"/.test(html), 'Missing social sharing image.');
requireCheck(/name="twitter:card"/.test(html), 'Missing social sharing card.');
requireCheck(/rel="canonical"/.test(html), 'Missing canonical URL.');
requireCheck(/href="[^"]*#(?:main|main-content|content)"/.test(html), 'Missing skip-to-content link.');
requireCheck(/<main\b/.test(html), 'Missing main landmark.');
requireCheck(/mailto:meetpatel132465@gmail\.com/.test(html), 'Missing working public email link.');
requireCheck(!/9265324158|27(?:th)?\s+October\s+2005/.test(html), 'Private phone/date of birth found in website.');
requireCheck(!/href="(?:#|javascript:[^"]*)"/.test(html), 'Found placeholder or unsafe link.');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
requireCheck(new Set(ids).size === ids.length, 'Duplicate HTML IDs.');
const idSet = new Set(ids);
const links = [...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map(x => x[1].replaceAll('&amp;', '&'));
let localCount = 0;
for (const link of links) {
  if (!link || /^(https?:|mailto:|tel:|data:)/.test(link)) continue;
  const [urlPath, fragment] = link.split('#');
  if (fragment && (!urlPath || urlPath === base)) requireCheck(idSet.has(fragment), `Broken anchor: ${link}`);
  if (!urlPath) continue;
  const clean = urlPath.split('?')[0];
  let relative = clean;
  if (clean.startsWith('/')) {
    requireCheck(clean.startsWith(base), `Asset/link ignores Pages base path: ${link}`);
    relative = clean.slice(base.length);
  }
  const target = path.resolve(dist, relative || 'index.html');
  requireCheck(target.startsWith(dist + path.sep), `Path escapes output folder: ${link}`);
  try {
    const info = await stat(target);
    if (info.isDirectory()) await stat(path.join(target, 'index.html'));
    localCount++;
  } catch { failures.push(`Missing local resource: ${link}`); }
}
for (const image of html.matchAll(/<img\b[^>]*>/gi)) requireCheck(/\balt="[^"]*"/.test(image[0]), 'Image without alt text.');
for (const repo of ['enterprise-knowledge-copilot', 'pm25-forecasting-system', 'hospital-management-system']) {
  requireCheck(html.includes(`https://github.com/07MEET/${repo}`), `Missing selected project repository: ${repo}`);
}
for (const file of ['404.html', 'robots.txt', 'sitemap.xml']) {
  try { await stat(path.join(dist, file)); } catch { failures.push(`Missing generated ${file}.`); }
}
const css = await readFile(path.join(dist, 'site.css'), 'utf8').catch(() => '');
requireCheck(/prefers-reduced-motion/.test(css), 'Missing reduced-motion support.');
requireCheck(/focus-visible/.test(css), 'Missing visible keyboard focus style.');
if (failures.length) {
  console.error(failures.map(x => `FAIL: ${x}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Static checks passed: metadata, privacy, headings, ${localCount} local resources, anchors, project links, focus and reduced motion.`);
}
