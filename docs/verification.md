# Verification record

Checks completed on 14 October 2026 against the production build served at **http://127.0.0.1:4173/portfolio/**. The browser used was headless Chrome through Playwright. Source data comes from the supplied resumes, public repositories, the official AISEHack archive, and the owner's answers; see [content review](content-review.md) and [project evidence](project-evidence.md).

## Local results

| Check | Result |
| --- | --- |
| Production build and generated-site checks | Passed |
| Screen widths | 320, 375, 390, 768, 1024, and 1440 px; no horizontal overflow after final typography edits |
| Project images | All three loaded with explicit dimensions and descriptive alternatives |
| Heading and landmark structure | One `h1`; descriptive section headings; header, named navigation, main, and footer |
| Keyboard access | First Tab reveals skip link; Enter focuses main; project details open/close with Space |
| Focus | Thirty sequential Tab stops settle in view with visible 3 px outlines; no keyboard trap found |
| Mobile navigation | Space opens; expanded state changes; Escape closes and returns focus; outside click closes; navigation link closes and reaches its section |
| Menu scrolling | Menu is inline and keeps normal page scrolling; no modal scroll lock is needed |
| Section links | Every homepage fragment resolves to an existing section/project |
| Reduced motion | Smooth scrolling becomes `auto`; hover transforms are removed; transitions reduce to 0.01 ms |
| JavaScript disabled | Main content, all three navigation links, project details, and resume links remain usable |
| Resume download | Actual link click downloads `resume.pdf`; 123,271 bytes; byte-identical to the explicitly approved off-campus resume |
| Resume response | HTTP 200; `application/pdf`; valid PDF signature |
| Social image | HTTP 200; PNG; 1200 × 630 px |
| Browser errors | No JavaScript page errors observed |

The first keyboard visibility test sampled positions while Chrome was still performing its native smooth scroll. Waiting for the focused element to settle resolved that test timing issue; no source change was needed.

## Text contrast

Computed foreground/background colours on visible page text passed the WCAG normal-text minimum of 4.5:1 and large-text minimum of 3:1. The palette is unchanged by the final typography edits.

| Combination | Ratio |
| --- | --- |
| Ink on paper | 15.29:1 |
| Green on paper / paper on green button | 5.88:1 |
| Muted text on paper | 5.50:1 |
| Ink on contact surface | 13.94:1 |
| Green on contact surface | 5.36:1 |
| Muted text on contact surface | 5.01:1 |

The layout was also checked at 320 CSS pixels for narrow reflow. An axe-core run and a screen reader audit were not performed. The executed checks use browser interaction, DOM inspection, and computed colour values.

## External destinations

Direct HTTP checks returned **200** for all three featured project repositories, the hackathon team repository, the official AISEHack event page, and the GitHub profile. LinkedIn returned **999**, its access restriction response; the supplied profile URL remains in the site, but its full profile content could not be inspected. The email link points to `meetpatel132465@gmail.com`.

The site uses repository links and labeled architecture/schema illustrations. No live project demos or unverified screenshots are implied. The PM2.5 curve is explicitly labeled as schematic rather than measured output.

## Production status

At the time of this local check, live deployment verification was pending. After deployment, confirm the actual Pages URL, successful Actions run, HTTPS, production asset paths, contact links, resume download, and mobile navigation. Record the result here before final delivery.

No custom domain has been selected or registered. Namecheap eligibility for NMIMS India and domain availability remain unconfirmed; [deployment guide](deployment.md) records the official offer, differing renewal prices, and DNS/HTTPS steps.
