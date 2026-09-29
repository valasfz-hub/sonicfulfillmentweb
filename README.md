# Sonic Fulfillment Website

Marketing site and client dashboard preview for Sonic Fulfillment, a 3PL in Southern California.

## What's here

| Path | What it is |
|---|---|
| `site/` | The website. This is the folder to deploy. |
| `site/index.html` | Homepage |
| `site/dashboard.html` | Client login and dashboard (preview with sample data) |
| `site/assets/` | Logos and photos |
| `tools/build_logo_variants.py` | Rebuilds `site/assets/logo-white.png` from `site/assets/logo.png` (needs Pillow) |
| `sonic-fulfillment-brand-guidelines-navy-gold.pdf` | Brand guidelines (colors, fonts, logo usage) |

The site is plain HTML and CSS with no build step.

## Deploying

Point your host at the `site/` folder:

- **Netlify / Cloudflare Pages / Vercel:** connect this repo, leave the build command empty, set the publish (output) directory to `site`.
- **Any web server:** upload the contents of `site/`.

Then add your domain in the host's settings and update DNS as it instructs.

## Before launch

- **Quote form:** it validates and shows a confirmation but doesn't send anywhere yet. Connect it to a form service or CRM (see the `TODO` in `site/index.html`).
- **Client login:** it's a preview. Any email and password opens the dashboard with sample data. Real accounts and live data need a login service and a connection to the warehouse software.
