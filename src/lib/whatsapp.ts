import { SITE } from "@/lib/siteConfig";

export interface JobWhatsAppDetails {
  jobId?: string;
  status?: "pending" | "approved";
  companyName: string;
  position: string;
  vacancy: string;
  gender: string;
  experience: string;
  qualification: string;
  salary: string | null;
  jobTime: string;
  location: string;
  interviewName: string;
  interviewContact: string;
  companyEmail: string;
  responsibilities: string;
}

const v = (value: string | null | undefined, fallback = "Not specified") =>
  value && value.trim() ? value.trim() : fallback;

/** Full job-detail message (same fields the server-side alert sends). */
export const buildJobWhatsAppText = (d: JobWhatsAppDetails): string =>
  [
    "*NEW JOB POSTED - Kutch Business*",
    d.status ? `Status: ${d.status === "approved" ? "LIVE" : "PENDING review"}` : "",
    "",
    `*Position:* ${v(d.position)}`,
    `*Company:* ${v(d.companyName)}`,
    `*Vacancies:* ${v(d.vacancy, "1")}`,
    `*Gender:* ${v(d.gender, "Any")}`,
    `*Experience:* ${v(d.experience)}`,
    `*Qualification:* ${v(d.qualification)}`,
    `*Salary:* ${v(d.salary)}`,
    `*Timing:* ${v(d.jobTime)}`,
    `*Location:* ${v(d.location)}`,
    `*Interview contact:* ${v([d.interviewName, d.interviewContact].filter(Boolean).join(" - "))}`,
    `*Company email:* ${v(d.companyEmail)}`,
    `*Responsibilities:* ${v(d.responsibilities)}`,
    d.jobId ? `\nJob ID: ${d.jobId}` : "",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");

export const buildWhatsAppLink = (text: string, number: string = SITE.whatsappNumber) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
