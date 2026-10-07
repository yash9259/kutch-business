import type { Job } from "@/lib/mockData";
import { SITE, absoluteUrl, type FaqItem } from "@/lib/siteConfig";

type JsonLd = Record<string, unknown>;

export const organizationJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": ["Organization", "EmploymentAgency"],
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  url: SITE.url,
  logo: SITE.logo,
  image: SITE.logo,
  description: SITE.description,
  email: SITE.email,
  telephone: `+${SITE.whatsappNumber}`,
  areaServed: { "@type": "AdministrativeArea", name: "Kutch, Gujarat, India" },
  address: { "@type": "PostalAddress", addressRegion: SITE.region, addressCountry: SITE.country },
  sameAs: SITE.sameAs,
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: `+${SITE.whatsappNumber}`,
      contactType: "customer support",
      availableLanguage: ["English", "Hindi", "Gujarati"],
      areaServed: SITE.country,
    },
  ],
});

export const websiteJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE.url}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/jobs?keyword={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const faqJsonLd = (faqs: FaqItem[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const jobListJsonLd = (name: string, jobs: Pick<Job, "id" | "position">[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: jobs.slice(0, 50).map((job, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(`/jobs/${job.id}`),
    name: job.position,
  })),
});

const toEmploymentType = (jobTime: string): string[] => {
  const t = jobTime.toLowerCase();
  const types: string[] = [];
  if (t.includes("part")) types.push("PART_TIME");
  if (t.includes("contract")) types.push("CONTRACTOR");
  if (t.includes("intern")) types.push("INTERN");
  if (t.includes("temp")) types.push("TEMPORARY");
  if (!types.length) types.push("FULL_TIME");
  return types;
};

const parseAmounts = (salary: string): number[] =>
  (salary.match(/\d[\d,]*(?:\.\d+)?/g) || [])
    .map((n) => Number.parseFloat(n.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);

const KNOWN_GUJARAT = ["bhuj", "gandhidham", "adipur", "anjar", "mundra", "mandvi", "bhachau", "rapar", "kutch", "kachchh", "ahmedabad", "gandhinagar", "rajkot", "surat", "vadodara"];

export const jobPostingJsonLd = (job: Job): JsonLd => {
  const posted = job.postedAtISO || (job.postedAt ? `${job.postedAt}T00:00:00Z` : new Date().toISOString());
  const validThrough = new Date(new Date(posted).getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
  const amounts = parseAmounts(job.salaryRange || "");

  const description = [
    job.description || job.responsibilities,
    job.responsibilities && job.responsibilities !== job.description ? `Responsibilities: ${job.responsibilities}` : "",
    `Vacancies: ${job.vacancy}.`,
    job.experience ? `Experience: ${job.experience}.` : "",
    job.qualification && job.qualification !== "Not specified" ? `Qualification: ${job.qualification}.` : "",
    job.gender && job.gender !== "Any" ? `Preferred gender: ${job.gender}.` : "",
    job.jobTime ? `Timings: ${job.jobTime}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inGujarat = KNOWN_GUJARAT.some((c) => job.location.toLowerCase().includes(c));

  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.position,
    description: `<p>${description.replace(/</g, "&lt;")}</p>`,
    datePosted: posted,
    validThrough,
    employmentType: toEmploymentType(job.jobTime || ""),
    directApply: false,
    totalJobOpenings: job.vacancy,
    identifier: { "@type": "PropertyValue", name: job.companyName, value: job.id },
    url: absoluteUrl(`/jobs/${job.id}`),
    hiringOrganization: { "@type": "Organization", name: job.companyName },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        ...(inGujarat ? { addressRegion: SITE.region } : {}),
        addressCountry: SITE.country,
      },
    },
  };

  if (job.experience) ld.experienceRequirements = job.experience;
  if (job.qualification && job.qualification !== "Not specified") ld.educationRequirements = job.qualification;
  if (job.skills?.length) ld.skills = job.skills.join(", ");
  if (job.industry && job.industry !== "General") ld.industry = job.industry;

  if (amounts.length) {
    ld.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        ...(amounts.length > 1
          ? { minValue: Math.min(...amounts), maxValue: Math.max(...amounts) }
          : { value: amounts[0] }),
        unitText: "MONTH",
      },
    };
  }

  return ld;
};
