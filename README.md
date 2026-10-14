# Meet Patel's portfolio

A static portfolio for AI/ML, data engineering, and analyst opportunities. Four pages separate Home, Projects, Internship, and About. A neutral light palette, navy text, blue accents, and self-hosted Manrope typography accompany Meet's portrait.

[Portfolio](https://07MEET.github.io/portfolio/) · [GitHub](https://github.com/07MEET) · [LinkedIn](https://www.linkedin.com/in/meet-patel-aiml/)

## Run locally

Install Node.js 24 or newer. There are no packages to install.

```powershell
node scripts/build.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

Open http://127.0.0.1:4173/portfolio/. Stop the preview with Ctrl+C. After editing content or styles, rebuild and refresh the browser. The equivalent npm commands are `npm run build`, `npm run check`, and `npm run dev`.

## Update the website

- Edit names, introduction, project descriptions, links, experience, education, and contact details in [content/site.json](content/site.json). Keep project IDs consistent with the capability and experience links.
- Adjust colours, typography, and spacing in [public/site.css](public/site.css). The colour variables are grouped at the top. [Colour samples](docs/theme-samples.html) show the five original directions and their contrast ratios.
- Replace [public/resume.pdf](public/resume.pdf) when the resume changes. The approved off-campus resume is the current download. The `resume` field points to `resume.pdf`.
- Replace the portrait at `public/assets/meet-patel.webp` when needed. The original supplied photo remains outside the published source.
- Add project screenshots to `public/assets/` and set each project's `images` array to objects with `src`, meaningful `alt`, and optional `caption`, `width`, and `height`. Paths such as `assets/project-screen.webp` are relative to the public folder.
- For a demo, replace `video: null` with an object containing `src`, optional `poster`, and `captions` (a WebVTT file path). Optional `type` and `caption` fields are supported. Videos use native controls and never autoplay. Empty fields show honest coming-soon placeholders. Internship media lives under `experience.project`; other projects live in `projects`.
- Manrope is bundled locally under the SIL Open Font License in `public/assets/fonts/OFL.txt`; no external font request is needed.
- Keep the social preview image [public/assets/social.png](public/assets/social.png) consistent with the introduction. Its editable vector source is [public/assets/social.svg](public/assets/social.svg).
- Rebuild and run the checks before committing. Push to `main` to publish through [the Pages workflow](.github/workflows/deploy.yml).

Generated files in `dist/` should not be edited or committed. The original supplied resume PDFs and local inspection notes are excluded from Git; only the approved resume copy belongs in the public assets.

## Content choices

Enterprise Knowledge Copilot appears on Internship, connecting the role to document ingestion, retrieval, citations, and APIs. Projects contains PM2.5 Forecasting and Hospital Management System. The forecasting project includes Team VibeCoders' first-place result in AISEHack 2026's Pollution Forecasting track. About contains education, focused capabilities, and the site's contact links. Each page has one resume link in its shared navigation.

The hackathon is evidence for the forecasting project, rather than a duplicate project. Ongoing VL-JEPA work is omitted until there is a reviewable public result. School marks and a long skills inventory are omitted to keep attention on relevant work. Project performance percentages, production adoption, and business impact are not inferred from implementation details.

## GitHub Pages and domains

The configured origin is `https://07MEET.github.io` and repository path is `/portfolio/`. GitHub Pages must use **GitHub Actions** as its publishing source. The workflow builds static files with Node.js 24 and deploys only `dist/`.

See [the deployment and domain guide](docs/deployment.md) for Pages settings, Student Pack eligibility, current Namecheap terms, DNS verification, and HTTPS. GitHub Pages requires no Student Pack. A promotional domain is not permanently free; NMIMS India eligibility for the Namecheap offer remains unconfirmed.

For a custom domain, update `siteUrl` to its HTTPS origin and `basePath` to `/`, then rebuild. Verify domain ownership in GitHub and inspect existing website and email DNS records before making changes.

## Verification

[The verification report](docs/verification.md) records the tested layouts and interactions. The automated check validates local resources, navigation anchors, metadata, image descriptions, resume availability, and selected project links. Rendering, keyboard navigation, contrast, and reduced motion were checked in a browser.

The site needs no backend, paid service, analytics, or contact-form provider. Contact uses a working email link. Project and social links lead to their original public resources.
