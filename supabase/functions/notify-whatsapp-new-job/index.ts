// Sends ALL details of a newly posted job to the admin WhatsApp number (default 8780254591)
// using the WhatsApp Business Cloud API (Meta).
//
// Secrets (supabase secrets set ...):
//   WHATSAPP_TOKEN            permanent access token (System User) - required
//   WHATSAPP_PHONE_NUMBER_ID  Cloud API "Phone number ID"          - required
//   WHATSAPP_NOTIFY_TO        recipient, digits only               - default 918780254591
//   WHATSAPP_TEMPLATE_NAME    optional approved template name (1 body variable {{1}})
//   WHATSAPP_TEMPLATE_LANG    template language code               - default "en"
//   SITE_URL                  default https://www.kutchbusiness.com
//
// Without a template, WhatsApp only delivers free-form text if the recipient has messaged the
// business number in the last 24h. For reliable 24/7 alerts create + approve a template
// (see README "WhatsApp job alerts") and set WHATSAPP_TEMPLATE_NAME.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const NOTIFY_TO = (Deno.env.get("WHATSAPP_NOTIFY_TO") || "918780254591").replace(/\D/g, "");
const TEMPLATE_NAME = Deno.env.get("WHATSAPP_TEMPLATE_NAME");
const TEMPLATE_LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") || "en";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://www.kutchbusiness.com").replace(/\/$/, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const admin = SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

const MAX_JOB_AGE_MS = 15 * 60 * 1000; // only freshly posted jobs can trigger an alert

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const val = (v: unknown, fallback = "Not specified") =>
  v === null || v === undefined || String(v).trim() === "" ? fallback : String(v).trim();

const salary = (j: Record<string, any>) => {
  if (j.salary_range_text) return j.salary_range_text;
  const f = (n: number) => `Rs ${Number(n).toLocaleString("en-IN")}`;
  if (j.salary_min && j.salary_max) return `${f(j.salary_min)} - ${f(j.salary_max)}`;
  if (j.salary_min) return `From ${f(j.salary_min)}`;
  if (j.salary_max) return `Up to ${f(j.salary_max)}`;
  return "Not specified";
};

const buildMessage = (j: Record<string, any>) => {
  const status = j.status === "approved" ? "LIVE (published directly)" : "PENDING admin review";
  const when = new Date(j.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  const contact = [j.interview_contact_name, j.interview_contact_number].filter(Boolean).join(" - ");
  return [
    "*NEW JOB POSTED - Kutch Business*",
    `Status: ${status}`,
    "",
    `*Position:* ${val(j.position)}`,
    `*Company:* ${val(j.company_name)}`,
    `*Vacancies:* ${val(j.vacancy, "1")}`,
    `*Gender:* ${val(j.gender, "Any")}`,
    `*Experience:* ${val(j.experience)}`,
    `*Qualification:* ${val(j.qualification)}`,
    `*Salary:* ${salary(j)}`,
    `*Timing:* ${val(j.job_time)}`,
    `*Location:* ${val(j.location)}`,
    `*Interview contact:* ${val(contact)}`,
    `*Company email:* ${val(j.company_email)}`,
    `*Responsibilities:* ${val(j.responsibilities || j.description)}`,
    "",
    `Job ID: ${j.id}`,
    `Posted: ${when} IST`,
    `Review: ${SITE_URL}/admin/job-review/${j.id}`,
  ].join("\n");
};

// Template variables may not contain newlines/tabs and are limited in length.
const toTemplateParam = (text: string) =>
  text.replace(/\*/g, "").replace(/\s*\n+\s*/g, " | ").replace(/\s{2,}/g, " ").slice(0, 1000);

const sendWhatsApp = async (text: string) => {
  const payload = TEMPLATE_NAME
    ? {
        messaging_product: "whatsapp",
        to: NOTIFY_TO,
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: TEMPLATE_LANG },
          components: [{ type: "body", parameters: [{ type: "text", text: toTemplateParam(text) }] }],
        },
      }
    : {
        messaging_product: "whatsapp",
        to: NOTIFY_TO,
        type: "text",
        text: { body: text.slice(0, 4000), preview_url: false },
      };

  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message || `WhatsApp API error (${res.status})`);
  }
  return body;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!admin) return json({ sent: false, reason: "server_not_configured" });

    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== "string") return json({ error: "jobId is required" }, 400);

    // Always read the job from the database - never trust client-supplied details.
    const { data: job, error } = await admin.from("job_posts").select("*").eq("id", jobId).maybeSingle();
    if (error || !job) return json({ error: "Job not found" }, 404);

    if (Date.now() - new Date(job.created_at).getTime() > MAX_JOB_AGE_MS) {
      return json({ sent: false, reason: "job_too_old" });
    }

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.warn("WhatsApp credentials not set - skipping alert for job", jobId);
      return json({ sent: false, reason: "not_configured" });
    }

    // Claim the job so double submits / retries cannot send the alert twice.
    const claimedAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await admin
      .from("job_posts")
      .update({ whatsapp_notified_at: claimedAt })
      .eq("id", jobId)
      .is("whatsapp_notified_at", null)
      .select("id");

    if (claimError) {
      console.warn("Could not claim job (run supabase/whatsapp_notify.sql?):", claimError.message);
    } else if (!claimed || claimed.length === 0) {
      return json({ sent: true, duplicate: true });
    }

    try {
      await sendWhatsApp(buildMessage(job));
    } catch (sendError) {
      // release the claim so a retry is possible
      await admin.from("job_posts").update({ whatsapp_notified_at: null }).eq("id", jobId);
      throw sendError;
    }

    return json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("notify-whatsapp-new-job failed:", message);
    return json({ sent: false, error: message }, 502);
  }
});
