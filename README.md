# Sonic Fulfillment Website

Marketing site and client dashboard preview for Sonic Fulfillment, a 3PL in Southern California.

## What's here

| Path | What it is |
|---|---|
| `site/` | The website. This is the folder to deploy. |
| `site/index.html` | Homepage |
| `site/services.html`, `how-it-works.html`, `pricing.html`, `our-story.html`, `contact.html` | Inner pages |
| `site/assets/css/style.css`, `site/assets/js/main.js` | Styles and script shared by every page except the dashboard |
| `site/dashboard.html` | Client login and dashboard (preview with sample data) |
| `site/assets/` | Logos and photos |
| `site/sitemap.xml`, `site/robots.txt` | Tell search engines which pages to index |
| `functions/` | Cloud Function that saves quote requests and sends the emails |
| `firebase.json`, `firestore.rules` | Firebase Hosting and database configuration |
| `tools/build_wordpress_theme.py` | Builds the WordPress theme from `site/` into `wordpress/` (theme folder plus `sonic-fulfillment.zip` to upload) |
| `tools/build_logo_variants.py` | Rebuilds `site/assets/logo-white.png` from `site/assets/logo.png` (needs Pillow) |
| `sonic-fulfillment-brand-guidelines-navy-gold.pdf` | Brand guidelines (colors, fonts, logo usage) |

The site is plain HTML and CSS with no build step.

## How it runs

| Part | What handles it |
|---|---|
| Website | Firebase Hosting serves the `site/` folder (`firebase.json`) |
| Quote form | Posts to `/api/quote`, the `quote` Cloud Function in `functions/` |
| Leads | The function saves each request to the Firestore collection `leads` |
| Emails | The function sends the request to info@sonicfulfillment.com and a thank-you to the customer, through Resend |
| Deploys | `.github/workflows/firebase-deploy.yml` publishes on every push to `main` |

## One-time setup

1. **Firebase project:** create one at console.firebase.google.com with Google Analytics turned on. Upgrade it to the Blaze (pay-as-you-go) plan, which Cloud Functions require. Create the Firestore database (production mode).
2. **Resend:** create an account at resend.com, add and verify the domain `sonicfulfillment.com` (DNS records), and create an API key.
3. **Resend key into Firebase:** `npx firebase-tools login`, then `npx firebase-tools functions:secrets:set RESEND_API_KEY --project <project-id>` and paste the key.
4. **GitHub deploys:** in Firebase, Project settings > Service accounts > Generate new private key. In the GitHub repository, add the file's contents as the secret `FIREBASE_SERVICE_ACCOUNT`, and add the variable `FIREBASE_PROJECT_ID`. The service account needs the roles Firebase Admin, Cloud Functions Admin, Service Account User, and Secret Manager Viewer.
5. **Domain:** in Firebase Hosting, add the custom domain `sonicfulfillment.com` and set the DNS records it shows.
6. **Analytics:** copy the Measurement ID (`G-...`) from Firebase > Project settings > Integrations > Google Analytics into `GA_ID` at the top of `site/assets/js/main.js`.
7. **Search:** add the domain in Google Search Console and submit `https://sonicfulfillment.com/sitemap.xml`.

The deploy workflow skips itself until `FIREBASE_PROJECT_ID` is set.

## WordPress

`tools/build_wordpress_theme.py` builds the same site as a WordPress theme (`wordpress/sonic-fulfillment.zip`). Its quote form emails through WordPress instead of Firebase.

## Still a preview

- **Client login:** any email and password opens the dashboard with sample data. Real accounts and live data need a login service and a connection to the warehouse software.
