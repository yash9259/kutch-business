import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "suppoert@kutchbusiness.com";
const SENDER_NAME = Deno.env.get("SENDER_NAME") || "kutch business";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const adminClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

interface EmployerEmailPayload {
  employerEmail: string;
  employerName: string;
  jobPosition: string;
  companyName: string;
  emailType: "submitted" | "approved" | "rejected";
  jobId?: string;
  rejectionReason?: string;
  jobLink?: string;
  jobDetails?: {
    vacancy?: string;
    gender?: string;
    experience?: string;
    qualification?: string;
    salaryRange?: string | null;
    jobTime?: string;
    location?: string;
    interviewName?: string;
    interviewContact?: string;
    companyEmail?: string;
    responsibilities?: string;
  };
}

interface CandidateApplicationEmailPayload {
  recipientType?: "candidate";
  candidateEmail: string;
  candidateName: string;
  jobPosition: string;
  companyName: string;
  applicationStatus: "applied" | "shortlisted" | "interview" | "rejected" | "hired" | "withdrawn";
  applicationId?: string;
  jobId?: string;
}

interface CandidateInvoiceEmailPayload {
  recipientType?: "candidate_invoice";
  candidateId?: string;
  candidateEmail?: string;
  candidateName: string;
  invoiceNo: string;
  paymentId: string;
  amount: string;
  planName: string;
  paidAt: string;
  status: string;
}

type EmailPayload = EmployerEmailPayload | CandidateApplicationEmailPayload | CandidateInvoiceEmailPayload;

const normalizeEmail = (value: string | null | undefined) => (value || "").trim().toLowerCase();

const isCandidateStatusPayloadShape = (payload: EmailPayload) => {
  const candidatePayload = payload as CandidateApplicationEmailPayload;
  return Boolean(candidatePayload.candidateEmail && candidatePayload.applicationStatus && candidatePayload.jobPosition);
};

const isCandidateInvoicePayloadShape = (payload: EmailPayload) => {
  const invoicePayload = payload as CandidateInvoiceEmailPayload;
  return Boolean(invoicePayload.invoiceNo && invoicePayload.paymentId && invoicePayload.planName && invoicePayload.amount);
};

const resolveCandidateInvoiceEmail = async (payload: CandidateInvoiceEmailPayload): Promise<string> => {
  const fallbackEmail = normalizeEmail(payload.candidateEmail);

  if (!payload.candidateId || !adminClient) {
    if (!fallbackEmail) {
      throw new Error("Candidate registered email not found");
    }
    return fallbackEmail;
  }

  const { data, error } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", payload.candidateId)
    .maybeSingle();

  if (error) {
    if (fallbackEmail) {
      return fallbackEmail;
    }
    throw new Error(error.message);
  }

  const registeredEmail = normalizeEmail(data?.email);
  if (registeredEmail) {
    return registeredEmail;
  }

  if (fallbackEmail) {
    return fallbackEmail;
  }

  throw new Error("Candidate registered email not found");
};

const detailRow = (label: string, value: string | null | undefined) => {
  const safeValue = value && value.trim() ? value : "Not specified";
  return `<tr><td style="padding: 10px 12px; width: 180px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">${label}</td><td style="padding: 10px 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${safeValue}</td></tr>`;
};

const emailTemplates = {
  submitted: (data: EmployerEmailPayload) => ({
    subject: `Job Submission Received: ${data.jobPosition} at ${data.companyName}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%); color: #ffffff; padding: 24px 26px;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.6px; text-transform: uppercase; opacity: 0.9;">${SENDER_NAME}</p>
            <h2 style="margin: 8px 0 4px; font-size: 24px; line-height: 1.2;">Job Submission Received</h2>
            <p style="margin: 0; font-size: 14px; opacity: 0.92;">Reference ID: ${data.jobId || "Pending"}</p>
          </div>

          <div style="padding: 22px 26px;">
            <p style="margin: 0 0 10px; font-size: 15px;">Hello ${data.employerName},</p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Thank you for submitting your job post. Our admin team will review it shortly. Below is a full summary of your submitted details.</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 14px;"><strong>Position:</strong> ${data.jobPosition}</p>
              <p style="margin: 8px 0 0; font-size: 14px;"><strong>Company:</strong> ${data.companyName}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
              ${detailRow("Job Status", "Pending Review")}
              ${detailRow("Vacancy", data.jobDetails?.vacancy)}
              ${detailRow("Gender Preference", data.jobDetails?.gender)}
              ${detailRow("Work Experience", data.jobDetails?.experience)}
              ${detailRow("Qualification", data.jobDetails?.qualification)}
              ${detailRow("Salary Range", data.jobDetails?.salaryRange || undefined)}
              ${detailRow("Job Time", data.jobDetails?.jobTime)}
              ${detailRow("Location", data.jobDetails?.location)}
              ${detailRow("Interviewer Name", data.jobDetails?.interviewName)}
              ${detailRow("Interview Contact", data.jobDetails?.interviewContact)}
              ${detailRow("Company Email", data.jobDetails?.companyEmail)}
              ${detailRow("Job ID", data.jobId)}
            </table>

            <div style="margin-top: 16px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #334155;">Job Responsibilities</p>
              <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #0f172a;">${data.jobDetails?.responsibilities || "Not specified"}</p>
            </div>

            <div style="margin-top: 18px; font-size: 14px; color: #334155;">
              <p style="margin: 0 0 8px;"><strong>What happens next:</strong></p>
              <ul style="margin: 0; padding-left: 18px;">
                <li style="margin-bottom: 6px;">Your job will be reviewed by our admin team.</li>
                <li style="margin-bottom: 6px;">You will get another email after approval or if revision is required.</li>
                <li>Your listing will appear on the platform once approved.</li>
              </ul>
            </div>
          </div>

          <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 26px;">
            <p style="margin: 0; font-size: 13px; color: #475569;">Need help? Reply to this email and our team will assist you.</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">Regards,<br/>${SENDER_NAME} Team</p>
          </div>
        </div>
      </div>
    `,
  }),
  
  approved: (data: EmployerEmailPayload) => ({
    subject: `Job Approved: ${data.jobPosition} is now live! ✅`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%); color: #ffffff; padding: 24px 26px;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.6px; text-transform: uppercase; opacity: 0.9;">${SENDER_NAME}</p>
            <h2 style="margin: 8px 0 4px; font-size: 24px; line-height: 1.2;">Job Approved and Live</h2>
            <p style="margin: 0; font-size: 14px; opacity: 0.92;">Reference ID: ${data.jobId || "Pending"}</p>
          </div>

          <div style="padding: 22px 26px;">
            <p style="margin: 0 0 10px; font-size: 15px;">Hello ${data.employerName},</p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Great news. Your job listing has been approved and is now visible to candidates on ${SENDER_NAME}.</p>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 16px;">
              ${detailRow("Job Status", "Approved (Live)")}
              ${detailRow("Position", data.jobPosition)}
              ${detailRow("Company", data.companyName)}
              ${detailRow("Job ID", data.jobId)}
            </table>

            <div style="margin: 18px 0 4px;">
              <a href="${data.jobLink || "https://lotus-career-connect.com/jobs"}" style="background-color: #166534; color: #ffffff; padding: 11px 18px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 14px; font-weight: 600;">
                View Your Job Listing
              </a>
            </div>

            <p style="margin: 16px 0 0; font-size: 14px; color: #334155;">You will continue receiving updates as candidates apply to this job.</p>
          </div>

          <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 26px;">
            <p style="margin: 0; font-size: 13px; color: #475569;">Need support? Reply to this email and our team will help you.</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">Regards,<br/>${SENDER_NAME} Team</p>
          </div>
        </div>
      </div>
    `,
  }),
  
  rejected: (data: EmployerEmailPayload) => ({
    subject: `Job Submission Needs Revision: ${data.jobPosition}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #991b1b 0%, #ef4444 100%); color: #ffffff; padding: 24px 26px;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.6px; text-transform: uppercase; opacity: 0.9;">${SENDER_NAME}</p>
            <h2 style="margin: 8px 0 4px; font-size: 24px; line-height: 1.2;">Job Submission Needs Revision</h2>
            <p style="margin: 0; font-size: 14px; opacity: 0.92;">Reference ID: ${data.jobId || "Pending"}</p>
          </div>

          <div style="padding: 22px 26px;">
            <p style="margin: 0 0 10px; font-size: 15px;">Hello ${data.employerName},</p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Thanks for your submission. After review, this posting needs some updates before it can go live.</p>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 16px;">
              ${detailRow("Job Status", "Rejected (Needs Revision)")}
              ${detailRow("Position", data.jobPosition)}
              ${detailRow("Company", data.companyName)}
              ${detailRow("Job ID", data.jobId)}
            </table>

            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #9a3412;">Revision Notes</p>
              <p style="margin: 0; font-size: 14px; color: #7c2d12;">${data.rejectionReason || "Please review the job details and resubmit with updated information."}</p>
            </div>

            <p style="margin: 0; font-size: 14px; color: #334155;">Please update and resubmit your job posting. You can post again anytime from the platform.</p>
          </div>

          <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 26px;">
            <p style="margin: 0; font-size: 13px; color: #475569;">Need clarification? Reply to this email and we will guide you.</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">Regards,<br/>${SENDER_NAME} Team</p>
          </div>
        </div>
      </div>
    `,
  }),
};

const candidateStatusLabel: Record<CandidateApplicationEmailPayload["applicationStatus"], string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

const candidateStatusTone: Record<CandidateApplicationEmailPayload["applicationStatus"], string> = {
  applied: "#1d4ed8",
  shortlisted: "#2563eb",
  interview: "#0ea5e9",
  rejected: "#ef4444",
  hired: "#16a34a",
  withdrawn: "#64748b",
};

const candidateEmailTemplate = (data: CandidateApplicationEmailPayload) => ({
  subject: `Application Update: ${candidateStatusLabel[data.applicationStatus]} for ${data.jobPosition}`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, ${candidateStatusTone[data.applicationStatus]} 100%); color: #ffffff; padding: 24px 26px;">
          <p style="margin: 0; font-size: 12px; letter-spacing: 0.6px; text-transform: uppercase; opacity: 0.9;">${SENDER_NAME}</p>
          <h2 style="margin: 8px 0 4px; font-size: 24px; line-height: 1.2;">Application Status Updated</h2>
          <p style="margin: 0; font-size: 14px; opacity: 0.92;">${candidateStatusLabel[data.applicationStatus]}</p>
        </div>

        <div style="padding: 22px 26px;">
          <p style="margin: 0 0 10px; font-size: 15px;">Hello ${data.candidateName},</p>
          <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Your application status was updated by our admin team.</p>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            ${detailRow("Status", candidateStatusLabel[data.applicationStatus])}
            ${detailRow("Position", data.jobPosition)}
            ${detailRow("Company", data.companyName)}
            ${detailRow("Application ID", data.applicationId)}
            ${detailRow("Job ID", data.jobId)}
          </table>

          <p style="margin: 16px 0 0; font-size: 14px; color: #334155;">You can view all updates in your candidate dashboard under My Applications.</p>
        </div>

        <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 26px;">
          <p style="margin: 0; font-size: 13px; color: #475569;">Best wishes,<br/>${SENDER_NAME} Team</p>
        </div>
      </div>
    </div>
  `,
});

const candidateInvoiceTemplate = (data: CandidateInvoiceEmailPayload) => ({
  subject: `Payment Invoice ${data.invoiceNo} - kutch business`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: #ffffff; padding: 24px 26px;">
          <p style="margin: 0; font-size: 12px; letter-spacing: 0.6px; text-transform: uppercase; opacity: 0.9;">${SENDER_NAME}</p>
          <h2 style="margin: 8px 0 4px; font-size: 24px; line-height: 1.2;">Payment Invoice</h2>
          <p style="margin: 0; font-size: 14px; opacity: 0.92;">Invoice No: ${data.invoiceNo}</p>
        </div>

        <div style="padding: 22px 26px;">
          <p style="margin: 0 0 10px; font-size: 15px;">Hello ${data.candidateName},</p>
          <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">Your payment invoice details are below.</p>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            ${detailRow("Invoice No", data.invoiceNo)}
            ${detailRow("Payment ID", data.paymentId)}
            ${detailRow("Plan", data.planName)}
            ${detailRow("Amount", data.amount)}
            ${detailRow("Paid On", data.paidAt)}
            ${detailRow("Status", data.status)}
          </table>

          <p style="margin: 16px 0 0; font-size: 14px; color: #334155;">If you need any support, reply to this email.</p>
        </div>

        <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 26px;">
          <p style="margin: 0; font-size: 13px; color: #475569;">Regards,<br/>${SENDER_NAME} Team</p>
        </div>
      </div>
    </div>
  `,
});

async function sendViaResend(payload: EmailPayload) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const recipientType = (payload as CandidateApplicationEmailPayload | CandidateInvoiceEmailPayload).recipientType;
  const isCandidateStatusPayload = recipientType === "candidate" || isCandidateStatusPayloadShape(payload);
  const isCandidateInvoicePayload = recipientType === "candidate_invoice" || isCandidateInvoicePayloadShape(payload);

  const template = isCandidateStatusPayload
    ? candidateEmailTemplate(payload as CandidateApplicationEmailPayload)
    : isCandidateInvoicePayload
      ? candidateInvoiceTemplate(payload as CandidateInvoiceEmailPayload)
      : emailTemplates[(payload as EmployerEmailPayload).emailType](payload as EmployerEmailPayload);
  const toEmail = isCandidateStatusPayload
    ? (payload as CandidateApplicationEmailPayload).candidateEmail
    : isCandidateInvoicePayload
      ? await resolveCandidateInvoiceEmail(payload as CandidateInvoiceEmailPayload)
      : (payload as EmployerEmailPayload).employerEmail;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${SENDER_NAME} <${RESEND_FROM_EMAIL}>`,
      to: toEmail,
      subject: template.subject,
      html: template.html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Resend API error: ${data.message || response.statusText}`);
  }

  return data;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as EmailPayload;

    const recipientType = (payload as CandidateApplicationEmailPayload | CandidateInvoiceEmailPayload).recipientType;
    const isCandidatePayload = recipientType === "candidate" || isCandidateStatusPayloadShape(payload);
    const isCandidateInvoicePayload = recipientType === "candidate_invoice" || isCandidateInvoicePayloadShape(payload);

    if (isCandidatePayload) {
      const candidatePayload = payload as CandidateApplicationEmailPayload;
      if (!candidatePayload.candidateEmail || !candidatePayload.applicationStatus || !candidatePayload.jobPosition || !candidatePayload.companyName) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: candidateEmail, applicationStatus, jobPosition, companyName" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await sendViaResend(candidatePayload);

      return new Response(
        JSON.stringify({ success: true, messageId: result.id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (isCandidateInvoicePayload) {
      const invoicePayload = payload as CandidateInvoiceEmailPayload;
      if (!invoicePayload.invoiceNo || !invoicePayload.paymentId || !invoicePayload.amount || !invoicePayload.planName || !invoicePayload.candidateName) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: candidateName, invoiceNo, paymentId, amount, planName" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await sendViaResend(invoicePayload);

      return new Response(
        JSON.stringify({ success: true, messageId: result.id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const employerPayload = payload as EmployerEmailPayload;

    // Validate required fields
    if (!employerPayload.employerEmail || !employerPayload.emailType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: employerEmail, emailType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendViaResend(employerPayload);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
