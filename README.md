# Kutch Business - one repo, web + Android

```
kutch-business/
├── src/, public/, index.html ...   Web app (React + Vite + Supabase) - deploys to Vercel
├── scripts/generate-seo.mjs        Post-build SEO: static pages, JSON-LD, sitemap.xml
├── supabase/                       schema.sql, edge functions (email + WhatsApp alert)
├── android/                        Android WebView app (loads https://www.kutchbusiness.com/)
└── .github/workflows/android.yml   Builds signed APK + AAB when android/** changes
```

The Android app is a WebView wrapper around the live website, so **every web/SEO change shows up in the
app automatically** - no app release needed.

## Web

```sh
npm i
npm run dev        # http://localhost:8080
npm run build      # vite build + SEO prerender + sitemap (dist/)
```

Vercel: keep the project root at the repo root (build command `npm run build`, output `dist`).

## Android

Build happens in GitHub Actions (`Android - build release APK and AAB`) - download the APK/AAB from the run's
artifacts. Locally: open the `android/` folder in Android Studio. Add `KEYSTORE_BASE64` and `KEYSTORE_PASSWORD`
repo secrets for a permanent signing key (otherwise a temporary key is generated each run).

## SEO / AEO / AIO

| Layer | What | Where |
|---|---|---|
| SEO | Unique title/description/canonical/OG per page; `JobPosting`, `BreadcrumbList`, `ItemList`, `Organization`, `WebSite` JSON-LD | `src/components/seo/Seo.tsx`, `src/lib/structuredData.ts` |
| SEO | City landing pages `/jobs-in/<city>` (Bhuj, Gandhidham, Anjar, Mundra, Mandvi, Bhachau, Adipur, Rapar) | `src/pages/CityJobs.tsx`, `src/lib/siteConfig.ts` |
| SEO | Static prerendered HTML for `/`, `/jobs`, `/post-job`, `/register`, city pages and **every approved job**, plus `sitemap.xml` | `scripts/generate-seo.mjs` (runs on every build) |
| AEO | Visible FAQ sections + `FAQPage` JSON-LD (home, jobs, post-job, city pages) | `FaqSection.tsx`, `siteConfig.ts` |
| AIO | `robots.txt` welcoming GPTBot / ClaudeBot / PerplexityBot etc., `llms.txt`, server-visible content for non-JS bots | `public/` |

Admin, dashboard, login and reset pages are `noindex` and blocked in `robots.txt`.

**Keeping the sitemap/job pages fresh:** they are generated at build time, so new jobs appear after the next
deploy. In Vercel create a *Deploy Hook* and call it on a schedule (e.g. every 6 hours from cron-job.org or a
Supabase scheduled function) - or after each approval.

After deploying: submit `https://www.kutchbusiness.com/sitemap.xml` in Google Search Console and Bing Webmaster
Tools, then test a job URL with Google's Rich Results Test.

## WhatsApp job details (878 025 4591)

**Works out of the box - no WhatsApp API needed.** As soon as an employer posts a job, WhatsApp opens (app on
mobile, WhatsApp Web on desktop) with a chat to `918780254591` and **all job details pre-filled** (position,
company, vacancies, gender, experience, qualification, salary, timing, location, interview contact, company email,
responsibilities, job ID). The employer taps **Send**. If the browser blocks the pop-up, the success screen shows
an "Open WhatsApp & send job details" button with the same message. Inside the Android app the link opens the
WhatsApp app.

The message is built in `src/lib/whatsapp.ts`; the number is `SITE.whatsappNumber` in `src/lib/siteConfig.ts`.

### Optional: fully automatic alerts (needs Meta WhatsApp Business API)
The edge function `supabase/functions/notify-whatsapp-new-job` can send the alert with no employer action. If you
later get API access: run `supabase/whatsapp_notify.sql`, deploy the function and set `WHATSAPP_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID` (and ideally `WHATSAPP_TEMPLATE_NAME`). Until then it safely does nothing and the
pre-filled chat above is used.

## Other setup docs
`EMAIL_SETUP.md`, `RESEND_SETUP.md` (employer emails), `supabase/README.md`.
