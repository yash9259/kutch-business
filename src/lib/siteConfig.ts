// Single source of truth for brand / contact / SEO constants.
// Used by the React app AND mirrored in scripts/generate-seo.mjs (keep both in sync).

export const SITE = {
  name: "Kutch Business",
  legalName: "Kutch Business",
  url: "https://www.kutchbusiness.com",
  logo: "https://www.kutchbusiness.com/logo.png",
  tagline: "Jobs & hiring in Kutch, Gujarat",
  description:
    "Kutch Business is a local job portal for Kutch, Gujarat. Browse verified jobs in Bhuj, Gandhidham, Anjar, Mundra and across Kutch, or post a job and hire faster.",
  // WhatsApp / phone (international format, digits only)
  whatsappNumber: "918780254591",
  phoneDisplay: "+91 87802 54591",
  email: "kutchbusiness1@gmail.com",
  region: "Gujarat",
  country: "IN",
  locale: "en_IN",
  sameAs: [
    "https://www.facebook.com/share/16GoJDMm55/",
    "https://www.instagram.com/harekrishnajobplacement",
    "https://www.linkedin.com/in/hare-krishna-job-placement-a2066435a",
  ],
} as const;

export const absoluteUrl = (path = "/") =>
  `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

// Cities that get their own SEO landing page: /jobs-in/<slug>
export interface CityLanding {
  slug: string;
  name: string;
  blurb: string;
}

export const CITY_LANDINGS: CityLanding[] = [
  { slug: "bhuj", name: "Bhuj", blurb: "Bhuj is the district headquarters of Kutch and its biggest hub for retail, education, healthcare, tourism and government-linked work." },
  { slug: "gandhidham", name: "Gandhidham", blurb: "Gandhidham, next to Kandla Port, is Kutch's commercial and logistics centre, with steady hiring in warehousing, accounts, sales and office roles." },
  { slug: "anjar", name: "Anjar", blurb: "Anjar combines small manufacturing, trading and service businesses, and regularly hires for shop, factory and back-office positions." },
  { slug: "mundra", name: "Mundra", blurb: "Mundra is home to a major port and industrial zone, creating demand for logistics, operations, engineering and support staff." },
  { slug: "mandvi", name: "Mandvi", blurb: "Mandvi's tourism, hospitality and coastal businesses hire front-office, service and sales staff throughout the year." },
  { slug: "bhachau", name: "Bhachau", blurb: "Bhachau's growing industrial and trading base offers jobs in production, helpers, accounts and supervision." },
  { slug: "adipur", name: "Adipur", blurb: "Adipur, beside Gandhidham, offers local retail, school, clinic and office jobs close to home." },
  { slug: "rapar", name: "Rapar", blurb: "Rapar and eastern Kutch businesses look for sales, field, agriculture-linked and shop-floor staff." },
];

export const findCity = (slug?: string) =>
  CITY_LANDINGS.find((c) => c.slug === (slug || "").toLowerCase());

// FAQs are shown on-page AND emitted as FAQPage JSON-LD (answer-engine friendly).
export interface FaqItem {
  q: string;
  a: string;
}

export const HOME_FAQS: FaqItem[] = [
  {
    q: "What is Kutch Business?",
    a: "Kutch Business is a local job portal for Kutch, Gujarat. It connects job seekers with employers in Bhuj, Gandhidham, Anjar, Mundra, Mandvi and nearby towns, so people can find work close to home and businesses can hire local talent.",
  },
  {
    q: "How do I find a job in Kutch on this website?",
    a: "Open the Browse Jobs page, search by job title or filter by city, then open a listing to see the salary, timings, qualification, vacancy and interview contact. Register as a candidate to apply and track your applications.",
  },
  {
    q: "How can an employer post a job?",
    a: "Go to the Post a Job page, fill in the company name, position, vacancies, gender preference, experience, qualification, salary, job timings, location, interview contact and responsibilities, then submit. Our team is notified instantly, and your listing is published after a quick review.",
  },
  {
    q: "How long does it take for a posted job to appear?",
    a: "New listings may be reviewed by our team before they are published, which is usually quick. You receive a confirmation email on the company email address you provide.",
  },
  {
    q: "Which cities in Kutch do you cover?",
    a: "We list jobs across Kutch district, including Bhuj, Gandhidham, Adipur, Anjar, Mundra, Mandvi, Bhachau and Rapar, along with other nearby locations.",
  },
  {
    q: "How can I contact Kutch Business?",
    a: `You can message us on WhatsApp at ${SITE.phoneDisplay} or email ${SITE.email}.`,
  },
];

export const POST_JOB_FAQS: FaqItem[] = [
  HOME_FAQS[2],
  HOME_FAQS[3],
  {
    q: "What details should I include in a job post?",
    a: "Add the exact position, number of vacancies, required experience and qualification, salary range, working hours, work location, a contact person and number for interviews, and a clear list of responsibilities. Complete posts attract better candidates.",
  },
  HOME_FAQS[5],
];

export const JOBS_FAQS: FaqItem[] = [
  HOME_FAQS[1],
  HOME_FAQS[4],
  {
    q: "Do I need an account to view jobs?",
    a: "No. Anyone can browse and read job listings. You need to register as a candidate only when you want to apply or save jobs.",
  },
  HOME_FAQS[5],
];
