/**
 * Post-build SEO step:  vite build && node scripts/generate-seo.mjs
 *
 * 1. Fetches approved jobs from Supabase (REST, anon key, same data the public /jobs page uses).
 * 2. Writes static, crawlable HTML (title, meta, canonical, Open Graph, JSON-LD and readable
 *    content) for: /, /jobs, /post-job, /register, /jobs-in/<city> and /jobs/<id>.
 *    The React app still mounts on top of it, so users see no difference, but crawlers that do
 *    NOT run JavaScript (most AI / answer-engine bots) get real content.
 * 3. Writes dist/sitemap.xml.
 *
 * It never fails the build: if Supabase is unreachable it still emits all static pages + sitemap.
 * Keep SITE / CITIES / FAQ text in sync with src/lib/siteConfig.ts.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, process.env.SEO_DIST_DIR || "dist");

const SITE = {
  name: "Kutch Business",
  url: "https://www.kutchbusiness.com",
  logo: "https://www.kutchbusiness.com/logo.png",
  description:
    "Kutch Business is a local job portal for Kutch, Gujarat. Browse verified jobs in Bhuj, Gandhidham, Anjar, Mundra and across Kutch, or post a job and hire faster.",
  phone: "+91 87802 54591",
  email: "kutchbusiness1@gmail.com",
  region: "Gujarat",
  country: "IN",
};

const CITIES = [
  ["bhuj", "Bhuj", "Bhuj is the district headquarters of Kutch and its biggest hub for retail, education, healthcare, tourism and government-linked work."],
  ["gandhidham", "Gandhidham", "Gandhidham, next to Kandla Port, is Kutch's commercial and logistics centre, with steady hiring in warehousing, accounts, sales and office roles."],
  ["anjar", "Anjar", "Anjar combines small manufacturing, trading and service businesses, and regularly hires for shop, factory and back-office positions."],
  ["mundra", "Mundra", "Mundra is home to a major port and industrial zone, creating demand for logistics, operations, engineering and support staff."],
  ["mandvi", "Mandvi", "Mandvi's tourism, hospitality and coastal businesses hire front-office, service and sales staff throughout the year."],
  ["bhachau", "Bhachau", "Bhachau's growing industrial and trading base offers jobs in production, helpers, accounts and supervision."],
  ["adipur", "Adipur", "Adipur, beside Gandhidham, offers local retail, school, clinic and office jobs close to home."],
  ["rapar", "Rapar", "Rapar and eastern Kutch businesses look for sales, field, agriculture-linked and shop-floor staff."],
].map(([slug, name, blurb]) => ({ slug, name, blurb }));

const KNOWN_GUJARAT = ["bhuj", "gandhidham", "adipur", "anjar", "mundra", "mandvi", "bhachau", "rapar", "kutch", "kachchh", "ahmedabad", "gandhinagar", "rajkot", "surat", "vadodara"];

const HOME_FAQS = [
  ["What is Kutch Business?", "Kutch Business is a local job portal for Kutch, Gujarat. It connects job seekers with employers in Bhuj, Gandhidham, Anjar, Mundra, Mandvi and nearby towns, so people can find work close to home and businesses can hire local talent."],
  ["How do I find a job in Kutch on this website?", "Open the Browse Jobs page, search by job title or filter by city, then open a listing to see the salary, timings, qualification, vacancy and interview contact. Register as a candidate to apply and track your applications."],
  ["How can an employer post a job?", "Go to the Post a Job page, fill in the company name, position, vacancies, gender preference, experience, qualification, salary, job timings, location, interview contact and responsibilities, then submit. Our team is notified instantly, and your listing is published after a quick review."],
  ["Which cities in Kutch do you cover?", "We list jobs across Kutch district, including Bhuj, Gandhidham, Adipur, Anjar, Mundra, Mandvi, Bhachau and Rapar, along with other nearby locations."],
  ["How can I contact Kutch Business?", `You can message us on WhatsApp at ${SITE.phone} or email ${SITE.email}.`],
];

// ---------------------------------------------------------------- helpers
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const clip = (v, n) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
};

const abs = (p) => `${SITE.url}${p === "/" ? "/" : p}`;

const loadEnv = async () => {
  const env = { ...process.env };
  const file = path.join(ROOT, ".env");
  if (existsSync(file)) {
    const text = await readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
};

const fetchJobs = async (env) => {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[seo] Supabase env vars missing - generating static pages without jobs.");
    return [];
  }
  const select = [
    "id", "position", "company_name", "location", "salary_min", "salary_max", "salary_range_text",
    "experience", "qualification", "vacancy", "gender", "job_time", "responsibilities", "description",
    "industry", "skills", "created_at",
  ].join(",");
  try {
    const res = await fetch(`${url}/rest/v1/job_posts?select=${select}&status=eq.approved&order=created_at.desc&limit=1000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    console.log(`[seo] fetched ${rows.length} approved jobs`);
    return rows;
  } catch (err) {
    console.warn(`[seo] could not fetch jobs (${err.message}) - continuing without them.`);
    return [];
  }
};

const salaryText = (j) => {
  if (j.salary_range_text) return j.salary_range_text;
  const f = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  if (j.salary_min && j.salary_max) return `${f(j.salary_min)} - ${f(j.salary_max)}`;
  if (j.salary_min) return `From ${f(j.salary_min)}`;
  if (j.salary_max) return `Up to ${f(j.salary_max)}`;
  return "Not specified";
};

const employmentTypes = (t = "") => {
  const s = t.toLowerCase();
  const out = [];
  if (s.includes("part")) out.push("PART_TIME");
  if (s.includes("contract")) out.push("CONTRACTOR");
  if (s.includes("intern")) out.push("INTERN");
  if (s.includes("temp")) out.push("TEMPORARY");
  return out.length ? out : ["FULL_TIME"];
};

const jobPostingLd = (j) => {
  const posted = j.created_at;
  const validThrough = new Date(new Date(posted).getTime() + 45 * 864e5).toISOString();
  const amounts = (salaryText(j).match(/\d[\d,]*(?:\.\d+)?/g) || []).map((n) => parseFloat(n.replace(/,/g, ""))).filter((n) => n > 0);
  const desc = [
    j.description || j.responsibilities,
    j.responsibilities && j.responsibilities !== j.description ? `Responsibilities: ${j.responsibilities}` : "",
    `Vacancies: ${j.vacancy || 1}.`,
    j.experience ? `Experience: ${j.experience}.` : "",
    j.qualification ? `Qualification: ${j.qualification}.` : "",
    j.job_time ? `Timings: ${j.job_time}.` : "",
  ].filter(Boolean).join(" ");
  const inGujarat = KNOWN_GUJARAT.some((c) => (j.location || "").toLowerCase().includes(c));
  const ld = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: j.position,
    description: `<p>${esc(desc)}</p>`,
    datePosted: posted,
    validThrough,
    employmentType: employmentTypes(j.job_time),
    directApply: false,
    totalJobOpenings: j.vacancy || 1,
    identifier: { "@type": "PropertyValue", name: j.company_name, value: j.id },
    url: abs(`/jobs/${j.id}`),
    hiringOrganization: { "@type": "Organization", name: j.company_name },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: j.location, ...(inGujarat ? { addressRegion: SITE.region } : {}), addressCountry: SITE.country },
    },
  };
  if (j.experience) ld.experienceRequirements = j.experience;
  if (j.qualification) ld.educationRequirements = j.qualification;
  if (j.skills?.length) ld.skills = j.skills.join(", ");
  if (j.industry && j.industry !== "General") ld.industry = j.industry;
  if (amounts.length) {
    ld.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: { "@type": "QuantitativeValue", ...(amounts.length > 1 ? { minValue: Math.min(...amounts), maxValue: Math.max(...amounts) } : { value: amounts[0] }), unitText: "MONTH" },
    };
  }
  return ld;
};

const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(p) })),
});

const faqLd = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

const itemListLd = (name, jobs) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: jobs.slice(0, 50).map((j, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/jobs/${j.id}`), name: j.position })),
});

const jobListHtml = (jobs) =>
  jobs.length
    ? `<ul>${jobs
        .slice(0, 100)
        .map((j) => `<li><a href="/jobs/${esc(j.id)}">${esc(j.position)}</a> - ${esc(j.company_name)}, ${esc(j.location)} (${esc(salaryText(j))})</li>`)
        .join("")}</ul>`
    : "<p>New openings appear here as soon as employers post them.</p>";

const navHtml = `<nav><a href="/">Home</a> · <a href="/jobs">Browse jobs</a> · <a href="/post-job">Post a job</a> · <a href="/register">Register</a> · ${CITIES.map((c) => `<a href="/jobs-in/${c.slug}">Jobs in ${esc(c.name)}</a>`).join(" · ")}</nav>`;

const faqHtml = (faqs) => `<section><h2>Frequently asked questions</h2>${faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</section>`;

// Replace head tags + root content in the built index.html template.
const renderPage = (template, { path: p, title, description, jsonLd = [], body, noindex = false }) => {
  const fullTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;
  const canonical = abs(p);
  let html = template;
  const setMeta = (re, tag) => {
    html = re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
  };
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`);
  setMeta(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  setMeta(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}" />`);
  setMeta(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  setMeta(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
  setMeta(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(fullTitle)}" />`);
  setMeta(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  setMeta(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(fullTitle)}" />`);
  setMeta(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(description)}" />`);

  const ld = jsonLd.map((o) => `    <script type="application/ld+json" data-seo-jsonld="true">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
  if (ld) html = html.replace("</head>", `${ld}\n  </head>`);

  html = html.replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<noscript>)/, `<div id="root">${body}</div>`);
  return html;
};

const writePage = async (p, html) => {
  const file = p === "/" ? path.join(DIST, "index.html") : path.join(DIST, p, "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, "utf8");
};

// ---------------------------------------------------------------- main
const main = async () => {
  const templatePath = path.join(DIST, "index.html");
  if (!existsSync(templatePath)) {
    console.warn(`[seo] ${templatePath} not found - run "vite build" first. Skipping.`);
    return;
  }
  const template = (await readFile(templatePath, "utf8")).replace(/\s*<script type="application\/ld\+json" data-seo-jsonld[\s\S]*?<\/script>/g, "");
  const env = await loadEnv();
  const jobs = await fetchJobs(env);
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  const add = (p, priority, changefreq, lastmod = today) => urls.push({ loc: abs(p), priority, changefreq, lastmod });

  // Home
  await writePage("/", renderPage(template, {
    path: "/",
    title: "Jobs in Kutch, Gujarat - Find Jobs in Bhuj, Gandhidham, Anjar & Mundra",
    description: SITE.description,
    jsonLd: [faqLd(HOME_FAQS)],
    body: `<header><h1>Kutch Business - Jobs in Kutch, Gujarat</h1><p>${esc(SITE.description)}</p>${navHtml}</header><main><h2>Latest jobs in Kutch</h2>${jobListHtml(jobs.slice(0, 20))}</main>${faqHtml(HOME_FAQS)}`,
  }));
  add("/", "1.0", "daily");

  // Jobs index
  await writePage("/jobs", renderPage(template, {
    path: "/jobs",
    title: "Browse Jobs in Kutch, Gujarat - Latest Openings",
    description: "Browse the latest verified job openings in Kutch, Gujarat. Filter by city and experience and find jobs in Bhuj, Gandhidham, Anjar, Mundra and more.",
    jsonLd: [breadcrumbLd([["Home", "/"], ["Jobs", "/jobs"]]), itemListLd("Latest jobs in Kutch", jobs)],
    body: `<header>${navHtml}</header><main><h1>Browse jobs in Kutch, Gujarat</h1>${jobListHtml(jobs)}</main>`,
  }));
  add("/jobs", "0.9", "daily");

  // Post a job / Register
  await writePage("/post-job", renderPage(template, {
    path: "/post-job",
    title: "Post a Job in Kutch - Hire Local Talent Fast",
    description: "Post your job vacancy on Kutch Business and reach job seekers in Bhuj, Gandhidham, Anjar, Mundra and across Kutch, Gujarat.",
    jsonLd: [breadcrumbLd([["Home", "/"], ["Post a Job", "/post-job"]]), faqLd(HOME_FAQS.slice(2, 3))],
    body: `<header>${navHtml}</header><main><h1>Post a job in Kutch</h1><p>Fill in your company, position, vacancies, salary, timings, location and interview contact. Our team is notified instantly.</p></main>`,
  }));
  add("/post-job", "0.8", "monthly");

  await writePage("/register", renderPage(template, {
    path: "/register",
    title: "Register as a Candidate - Get Hired in Kutch",
    description: "Create your candidate profile on Kutch Business to apply for jobs in Bhuj, Gandhidham, Anjar, Mundra and across Kutch, Gujarat.",
    body: `<header>${navHtml}</header><main><h1>Register as a candidate</h1><p>Create your profile to apply for jobs across Kutch, Gujarat.</p></main>`,
  }));
  add("/register", "0.6", "monthly");

  // City landing pages
  for (const c of CITIES) {
    const cityJobs = jobs.filter((j) => (j.location || "").toLowerCase().includes(c.name.toLowerCase()));
    const p = `/jobs-in/${c.slug}`;
    await writePage(p, renderPage(template, {
      path: p,
      title: `Jobs in ${c.name}, Kutch - Latest Vacancies`,
      description: `Latest job vacancies in ${c.name}, Kutch, Gujarat. Find verified openings with salary, timings and interview details, or post a job to hire locally.`,
      jsonLd: [breadcrumbLd([["Home", "/"], ["Jobs", "/jobs"], [`Jobs in ${c.name}`, p]]), itemListLd(`Jobs in ${c.name}`, cityJobs)],
      body: `<header>${navHtml}</header><main><h1>Jobs in ${esc(c.name)}, Kutch</h1><p>${esc(c.blurb)}</p>${jobListHtml(cityJobs)}</main>`,
    }));
    add(p, "0.8", "daily");
  }

  // Individual jobs
  for (const j of jobs) {
    const p = `/jobs/${j.id}`;
    const details = [
      ["Company", j.company_name], ["Location", j.location], ["Salary", salaryText(j)], ["Experience", j.experience],
      ["Qualification", j.qualification], ["Vacancies", j.vacancy], ["Gender", j.gender], ["Timings", j.job_time],
    ].filter(([, v]) => v);
    await writePage(p, renderPage(template, {
      path: p,
      title: `${j.position} at ${j.company_name} - ${j.location}`,
      description: clip(`${j.company_name} is hiring a ${j.position} in ${j.location}. Salary: ${salaryText(j)}. Experience: ${j.experience || "Any"}. Vacancies: ${j.vacancy || 1}. Apply on Kutch Business.`, 300),
      jsonLd: [jobPostingLd(j), breadcrumbLd([["Home", "/"], ["Jobs", "/jobs"], [j.position, p]])],
      body: `<header>${navHtml}</header><main><article><h1>${esc(j.position)} at ${esc(j.company_name)} - ${esc(j.location)}</h1><ul>${details.map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join("")}</ul>${j.responsibilities || j.description ? `<h2>Job description</h2><p>${esc(j.responsibilities || j.description)}</p>` : ""}</article></main>`,
    }));
    add(p, "0.7", "weekly", String(j.created_at).slice(0, 10));
  }

  // Sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
  await writeFile(path.join(DIST, "sitemap.xml"), xml, "utf8");
  console.log(`[seo] wrote ${urls.length} pages + sitemap.xml`);
};

main().catch((err) => {
  // Never break the deploy because of SEO generation.
  console.warn("[seo] generation failed:", err);
});
