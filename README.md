# Meet Patel's portfolio

A static portfolio for AI/ML, data engineering, and analyst opportunities. It uses an Ink & Paper palette, responsive editorial layouts, three selected projects, expandable project explanations, and a public resume download.

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
- Update illustrations in [public/assets/](public/assets/). They describe the architecture and workflow; they are not screenshots or measured model outputs. Keep accessible image descriptions in [scripts/build.mjs](scripts/build.mjs) accurate when replacing them.
- Keep the social preview image [public/assets/social.png](public/assets/social.png) consistent with the introduction. Its editable vector source is [public/assets/social.svg](public/assets/social.svg).
- Rebuild and run the checks before committing. Push to `main` to publish through [the Pages workflow](.github/workflows/deploy.yml).

Generated files in `dist/` should not be edited or committed. The original supplied resume PDFs and local inspection notes are excluded from Git; only the approved resume copy belongs in the public assets.

## Content choices

Enterprise Knowledge Copilot leads because it connects the internship to document ingestion, retrieval, citations, and APIs. PM2.5 Forecasting demonstrates PyTorch model and training work, with a linked first-place result for Team VibeCoders in AISEHack 2026's Pollution Forecasting track. Hospital Management System demonstrates PostgreSQL design, SQL workflows, role access, and reporting.

The hackathon is evidence for the forecasting project, rather than a duplicate project. Ongoing VL-JEPA work is omitted until there is a reviewable public result. School marks and a long skills inventory are omitted to keep attention on relevant work. Project performance percentages, production adoption, and business impact are not inferred from implementation details.

## GitHub Pages and domains

The configured origin is `https://07MEET.github.io` and repository path is `/portfolio/`. GitHub Pages must use **GitHub Actions** as its publishing source. The workflow builds static files with Node.js 24 and deploys only `dist/`.

See [the deployment and domain guide](docs/deployment.md) for Pages settings, Student Pack eligibility, current Namecheap terms, DNS verification, and HTTPS. GitHub Pages requires no Student Pack. A promotional domain is not permanently free; NMIMS India eligibility for the Namecheap offer remains unconfirmed.

For a custom domain, update `siteUrl` to its HTTPS origin and `basePath` to `/`, then rebuild. Verify domain ownership in GitHub and inspect existing website and email DNS records before making changes.

## Verification

[The verification report](docs/verification.md) records the tested layouts and interactions. The automated check validates local resources, navigation anchors, metadata, image descriptions, resume availability, and selected project links. Rendering, keyboard navigation, contrast, and reduced motion were checked in a browser.

The site needs no backend, paid service, analytics, or contact-form provider. Contact uses a working email link. Project and social links lead to their original public resources.
