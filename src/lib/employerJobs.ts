import { supabase } from "@/lib/supabase";
import { getJobApprovalConfig } from "@/lib/settings";
import { buildJobWhatsAppText, buildWhatsAppLink } from "@/lib/whatsapp";

export interface EmployerJobSubmissionInput {
  companyName: string;
  position: string;
  vacancy: string;
  gender: string;
  experience: string;
  qualification: string;
  salaryMin: string;
  salaryMax: string;
  jobTime: string;
  jobTimingDetails: string;
  location: string;
  interviewName: string;
  interviewContact: string;
  companyEmail: string;
  responsibilities: string;
}

export interface EmployerJobSubmissionResult {
  jobId: string;
  emailSent: boolean;
  emailError: string | null;
  /** true when the admin WhatsApp alert (878 025 4591) was delivered by the server. */
  whatsappSent: boolean;
  /** wa.me link with every job detail pre-filled, used as a one-tap fallback. */
  whatsappLink: string;
}

const parseSalary = (value: string) => {
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatSalaryText = (min: number | null, max: number | null) => {
  if (min && max) {
    return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  }

  if (min) {
    return `From ₹${min.toLocaleString("en-IN")}`;
  }

  if (max) {
    return `Up to ₹${max.toLocaleString("en-IN")}`;
  }

  return null;
};

// Triggers the server-side WhatsApp alert (edge function notify-whatsapp-new-job).
// Never throws: a WhatsApp problem must not break job posting.
const notifyAdminOnWhatsApp = async (jobId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-whatsapp-new-job`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ jobId }),
      },
    );
    const data = await response.json().catch(() => ({}));
    return Boolean(response.ok && data?.sent);
  } catch (error) {
    console.warn("WhatsApp alert failed:", error);
    return false;
  }
};

export const submitEmployerJob = async (
  input: EmployerJobSubmissionInput,
): Promise<EmployerJobSubmissionResult> => {
  if (!input.gender?.trim()) {
    throw new Error("Gender preference is required");
  }

  if (!input.jobTime?.trim()) {
    throw new Error("Job timing is required");
  }

  if (!input.jobTimingDetails?.trim()) {
    throw new Error("Set timings is required");
  }

  if (!input.interviewContact?.trim()) {
    throw new Error("Interview contact is required");
  }

  const vacancyParsed = Number.parseInt(input.vacancy, 10);
  const vacancy = Number.isFinite(vacancyParsed)
    ? Math.min(Math.max(vacancyParsed, 1), 99)
    : 1;

  const salaryMin = parseSalary(input.salaryMin);
  const salaryMax = parseSalary(input.salaryMax);
  const jobTimeText = `${input.jobTime.trim()} - ${input.jobTimingDetails.trim()}`;

  const config = await getJobApprovalConfig();
  const initialStatus = config.required ? "pending" : "approved";

  const { data: jobRow, error: jobError } = await supabase
    .from("job_posts")
    .insert({
      created_by: null,
      company_name: input.companyName.trim(),
      position: input.position.trim(),
      vacancy,
      gender: input.gender.trim(),
      experience: input.experience.trim() || null,
      qualification: input.qualification.trim() || null,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_range_text: formatSalaryText(salaryMin, salaryMax),
      job_time: jobTimeText,
      location: input.location.trim(),
      responsibilities: input.responsibilities.trim() || null,
      description: input.responsibilities.trim() || null,
      interview_contact_name: input.interviewName.trim() || null,
      interview_contact_number: input.interviewContact.trim(),
      company_email: input.companyEmail.trim().toLowerCase(),
      status: initialStatus,
    })
    .select("id, position, company_name, location, company_email")
    .single();

  if (jobError) {
    throw new Error(jobError.message);
  }

  const { error: notificationError } = await supabase.from("notifications").insert({
    title: config.required 
      ? `New employer job submission: ${jobRow.position}`
      : `New employer job post (Directly Published): ${jobRow.position}`,
    body: [
      `Company: ${jobRow.company_name}`,
      `Position: ${jobRow.position}`,
      `Location: ${jobRow.location}`,
      `Employer Email: ${jobRow.company_email}`,
      `Job ID: ${jobRow.id}`,
      `Status: ${initialStatus === "approved" ? "Approved (Direct Publish)" : "Pending Admin Review"}`,
    ].join("\n"),
    notification_type: "employer_job_submission",
    created_by: null,
  });

  if (notificationError) {
    throw new Error(notificationError.message);
  }

  // Instant WhatsApp alert with all job details to the admin number (runs alongside the email below)
  const whatsappPromise = notifyAdminOnWhatsApp(jobRow.id);

  // Send confirmation email to employer
  let emailSent = false;
  let emailError: string | null = null;
  try {
    const salaryRange = formatSalaryText(salaryMin, salaryMax);
    await sendEmployerEmail({
      employerEmail: input.companyEmail.trim().toLowerCase(),
      employerName: input.interviewName.trim() || "Employer",
      jobPosition: input.position.trim(),
      companyName: input.companyName.trim(),
      emailType: config.required ? "submitted" : "approved",
      jobId: jobRow.id,
      jobLink: config.required ? undefined : `${window.location.origin}/jobs/${jobRow.id}`,
      jobDetails: {
        vacancy: input.vacancy || "1",
        gender: input.gender || "Any",
        experience: input.experience || "Not specified",
        qualification: input.qualification || "Not specified",
        salaryRange,
        jobTime: jobTimeText,
        location: input.location || "Not specified",
        interviewName: input.interviewName || "Not specified",
        interviewContact: input.interviewContact || "Not specified",
        companyEmail: input.companyEmail.trim().toLowerCase(),
        responsibilities: input.responsibilities || "Not specified",
      },
    });
    emailSent = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Email sending failed";
    console.error("Confirmation email error:", emailError);
  }

  const whatsappSent = await whatsappPromise;
  const whatsappLink = buildWhatsAppLink(
    buildJobWhatsAppText({
      jobId: jobRow.id,
      status: initialStatus,
      companyName: input.companyName.trim(),
      position: input.position.trim(),
      vacancy: String(vacancy),
      gender: input.gender.trim(),
      experience: input.experience.trim(),
      qualification: input.qualification.trim(),
      salary: formatSalaryText(salaryMin, salaryMax),
      jobTime: jobTimeText,
      location: input.location.trim(),
      interviewName: input.interviewName.trim(),
      interviewContact: input.interviewContact.trim(),
      companyEmail: input.companyEmail.trim().toLowerCase(),
      responsibilities: input.responsibilities.trim(),
    }),
  );

  return {
    jobId: jobRow.id,
    emailSent,
    emailError,
    whatsappSent,
    whatsappLink,
  };
};

export interface AdminNotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
}

export const listAdminNotifications = async (): Promise<AdminNotificationItem[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, notification_type, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    type: item.notification_type,
    createdAt: item.created_at.slice(0, 10),
  }));
};

export const createAdminNotification = async (input: { type: string; title: string; message: string }) => {
  const { error } = await supabase.from("notifications").insert({
    title: input.title.trim(),
    body: input.message.trim(),
    notification_type: input.type.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (error) {
    throw new Error(error.message);
  }
};

// Send employer email via Resend Edge Function
export const sendEmployerEmail = async (payload: {
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
}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-employer-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

export const sendCandidateApplicationStatusEmail = async (payload: {
  candidateEmail: string;
  candidateName: string;
  jobPosition: string;
  companyName: string;
  applicationStatus: "applied" | "shortlisted" | "interview" | "rejected" | "hired" | "withdrawn";
  applicationId?: string;
  jobId?: string;
}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-employer-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ...payload,
          recipientType: "candidate",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send candidate status email");
    }

    return await response.json();
  } catch (error) {
    console.error("Candidate status email error:", error);
    throw error;
  }
};

export const sendCandidateInvoiceEmail = async (payload: {
  candidateId: string;
  candidateEmail?: string;
  candidateName: string;
  invoiceNo: string;
  paymentId: string;
  amount: string;
  planName: string;
  paidAt: string;
  status: string;
}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-employer-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ...payload,
          recipientType: "candidate_invoice",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send candidate invoice email");
    }

    return await response.json();
  } catch (error) {
    console.error("Candidate invoice email error:", error);
    throw error;
  }
};

// Update job status and send approval/rejection email
export const updateJobStatusWithEmail = async (jobId: string, newStatus: "approved" | "rejected", rejectionReason?: string) => {
  // Fetch job details
  const { data: jobRow, error: fetchError } = await supabase
    .from("job_posts")
    .select("id, position, company_name, company_email, interview_contact_name")
    .eq("id", jobId)
    .single();

  if (fetchError || !jobRow) {
    throw new Error("Job not found");
  }

  // Update job status
  const { error: updateError } = await supabase
    .from("job_posts")
    .update({ status: newStatus })
    .eq("id", jobId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Send email
  try {
    await sendEmployerEmail({
      employerEmail: jobRow.company_email,
      employerName: jobRow.interview_contact_name || "Employer",
      jobPosition: jobRow.position,
      companyName: jobRow.company_name,
      emailType: newStatus === "approved" ? "approved" : "rejected",
      jobId,
      rejectionReason,
      jobLink: newStatus === "approved" ? `https://www.kutchbusiness.com/jobs/${jobId}` : undefined,
    });
  } catch (emailError) {
    console.warn("Email sending failed (job status updated):", emailError);
    // Don't fail the job update if email fails
  }

  return jobRow;
};
