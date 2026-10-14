# Deployment and domain guide

Checked against official sources on 14 October 2026. The portfolio has been published to GitHub Pages and verified over HTTPS. No custom domain has been registered or configured.

## GitHub Pages first

The public repository is [07MEET/portfolio](https://github.com/07MEET/portfolio), with the live address **https://07meet.github.io/portfolio/**. Authenticated inspection confirmed that the repository did not exist before creation. It now publishes through GitHub Actions with HTTPS enforced. [Successful deployment](https://github.com/07MEET/portfolio/actions/runs/38523247703)

GitHub Pages is available for public repositories on GitHub Free. You do **not** need the Student Developer Pack to host this site. The portfolio contains static HTML, CSS, JavaScript, and images; the Node build runs before deployment and no server runs on Pages. [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

### Preview locally

From the repository directory, with Node.js 24 installed:

```powershell
node scripts/build.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

Open **http://127.0.0.1:4173/portfolio/**. The production files are generated in `dist/`. Change portfolio copy in [content/site.json](../content/site.json), then rebuild. Do not edit generated files in `dist/`.

### Publish the prepared site

1. Sign into GitHub as `07MEET` using normal account authorization. Create a public repository named `portfolio` if it does not exist. If it exists, inspect its contents, default branch, Actions, Pages settings, and any domain before proceeding.
2. Upload or push the source on the `main` branch. Review the tracked files first: the original source resumes, research notes, and temporary inspection files are excluded. The explicitly approved off-campus resume is included as `public/resume.pdf`.
3. In the repository, open **Settings → Pages → Build and deployment**, and choose **GitHub Actions** as the source.
4. The prepared [deployment workflow](../.github/workflows/deploy.yml) builds and checks the site, uploads only `dist/`, and deploys it through GitHub's Pages actions. A push to `main` starts it; **Actions → Deploy portfolio to GitHub Pages → Run workflow** can also start a deployment manually.
5. Wait for the Actions run to succeed. Open the deployment URL reported by its `github-pages` environment. Check the live homepage, project pages, assets, contact link, social links, and approved resume download.

GitHub's custom workflow needs Pages write permission, an identity token, and a `github-pages` environment. The workflow uses the official configure, upload, and deployment actions. [GitHub workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

### Repository paths

The default configuration in [content/site.json](../content/site.json) is:

```json
{
  "siteUrl": "https://07MEET.github.io",
  "basePath": "/portfolio/"
}
```

Keep the trailing slash. If the repository is renamed, update `basePath` to the new repository name and rebuild. A repository named `07MEET.github.io` would publish at the account root and need `basePath` set to `/`. A custom domain also needs `/` and its full HTTPS origin in `siteUrl`. This updates internal paths, canonical URLs, and social sharing URLs together.

## Student Pack and Namecheap

The Student Developer Pack is optional for hosting, but applying can unlock partner offers. GitHub requires a personal account, age 13 or older, enrollment in a degree or diploma program, and dated evidence of current student status. The application may require a verified academic email; accepted evidence includes a dated ID, class schedule, transcript, or enrollment letter. Based on the supplied NMIMS degree enrollment, applying is reasonable, but GitHub must approve it. Start at [GitHub Education](https://github.com/settings/education/benefits), and follow [GitHub's application requirements](https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student).

The current [Student Developer Pack listing](https://education.github.com/pack) advertises one year of `.me` registration and one SSL certificate free for one year from Namecheap. This does not promise a free `.com`, `.io`, `.tech`, or `.website`; Namecheap lists those as discounted alternatives.

Namecheap's [education FAQ](https://nc.me/faq) currently describes supported schools in the US, UK, Canada, and Australia. NMIMS and Narsee Monjee were not found in its school list. This leaves **NMIMS India eligibility unconfirmed**, even though the GitHub listing advertises the offer. Ask Namecheap support to confirm eligibility for the actual school/email or approved Pack account before relying on it. The FAQ provides a school request route. No preferred name has been supplied, so domain availability has not been checked or reserved. Search the chosen name on [nc.me](https://nc.me/) only once it has been selected.

### Costs after the promotion

| Item | Published terms checked on 14 October 2026 |
| --- | --- |
| Namecheap education `.me` registration | First year free if eligible |
| Education bundle renewal | `nc.me` FAQ currently states **US$15/year** |
| Standard `.me` renewal | Namecheap's regular `.me` page currently lists **US$23.98/year** |
| `.me` ICANN fee | Regular `.me` page lists **US$0.00** |
| Domain privacy | Included for eligible `.me` domains |
| HTTPS on Pages | Provided automatically by GitHub for correctly configured sites |

The education and standard renewal prices differ. Confirm which rate applies in the Namecheap account and checkout before registration; prices and exchange rates can change. The regular promotion excludes premium domains. Review the final amount for any applicable tax or payment/currency charge and any selected add-ons. Hosting, paid DNS, private email, and a separate SSL certificate are unnecessary for this portfolio on Pages. [Namecheap `.me` prices and domain details](https://www.namecheap.com/domains/registration/cctld/me/)

Namecheap's FAQ describes automatic renewal and an opt-out in its advance notification. Review the account's renewal preference and expiration date after registration. Do not assume that reapplying for the Student Pack resets a redeemed offer; [GitHub's terms](https://docs.github.com/en/education/about-github-education/github-education-for-students/github-terms-and-conditions-for-the-student-developer-pack) say partner offers generally cannot be redeemed repeatedly and can change.

If all costs must stay zero, keep the GitHub Pages address. A promotional custom domain has a renewal cost after the free period.

## Connect a domain once selected and registered

Before changing DNS, export or record the current records at the **authoritative DNS provider**. Check existing website records and email records, including MX, SPF, DKIM, and DMARC. Preserve email and unrelated service records. Do not switch nameservers merely to connect Pages. If an existing apex website must stay, use an unused subdomain for the portfolio.

1. In GitHub **personal account Settings → Pages**, add the owned domain for verification. Add the exact TXT record GitHub supplies, usually at `_github-pages-challenge-07MEET`. Wait for propagation, click **Verify**, and retain the TXT record. This step occurs in account settings, separate from repository settings. [GitHub domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
2. In **repository Settings → Pages**, set the chosen custom domain before pointing its DNS to Pages. With this Actions workflow, a `CNAME` file is not required; the repository's Pages setting controls the domain. Update `siteUrl` and `basePath` in the content configuration and rebuild.
3. At the DNS provider, add the website records below. At Namecheap this is **Domain List → Manage → Advanced DNS → Host Records** when using Namecheap DNS. Resolve conflicting website/parking records only for the hosts being moved. [Namecheap's Pages setup guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9645/2208/how-do-i-link-my-domain-to-github-pages/)

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `07MEET.github.io` |

For a subdomain such as `portfolio.example.me`, use a CNAME with host `portfolio` and value `07MEET.github.io`. The value excludes `https://`, `/portfolio/`, and the repository name. Avoid wildcard records. Optional apex IPv6 records are `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, and `2606:50c0:8003::153`; use all four if configured. Reconfirm the current addresses in [GitHub's DNS documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

4. Wait for the Pages DNS check and certificate provisioning. Enable **Enforce HTTPS** when available, and verify both the selected address and its redirect variant. GitHub obtains the certificate automatically; the separate Namecheap certificate offer does not need to be installed. Check that assets use HTTPS and that no conflicting website records prevent certificate issuance. [GitHub HTTPS setup](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

The public repository and GitHub Pages publishing settings were created with the owner's existing GitHub authorization. No domain registration or DNS changes were performed.
