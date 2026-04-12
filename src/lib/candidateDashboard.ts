import { supabase } from "@/lib/supabase";
import { sendCandidateApplicationStatusEmail } from "@/lib/employerJobs";
import { getPaymentSystemEnabled } from "@/lib/paymentSystem";
import type { CandidateProfile as RegistrationCandidateProfile } from "@/lib/candidateAuth";
import type { EducationEntry, ExperienceEntry, Job as MockJob } from "@/lib/mockData";

const APPROVED_JOBS_CACHE_TTL_MS = 30000;
const approvedJobsCache = new Map<string, { timestamp: number; data: MockJob[] }>();

const createApprovedJobsCacheKey = (filters: JobFiltersInput) =>
  JSON.stringify({
    keyword: filters.keyword.trim().toLowerCase(),
    city: filters.city,
    experience: filters.experience,
    category: filters.category,
  });

export interface CandidateProfileForm {
  fullName: string;
  email: string;
  mobile: string;
  fatherMobile: string;
  gender: string;
  dob: string;
  maritalStatus: string;
  languages: string;
  presentAddress: string;
  permanentAddress: string;
}

export interface CandidateReferenceForm {
  familyName: string;
  familyContact: string;
  friendName: string;
  friendContact: string;
}

export interface DashboardApplicationItem {
  id: string;
  candidateId: string;
  jobId: string;
  candidateName: string;
  position: string;
  company: string;
  location: string;
  appliedAt: string;
  status: "applied" | "shortlisted" | "interview" | "rejected" | "hired" | "withdrawn";
}

export interface ResumeItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  isActive: boolean;
  filePath: string;
}

export interface DashboardOverview {
  totalJobs: number;
  appliedJobs: number;
  savedJobs: number;
  interviewCalls: number;
  recentApplications: DashboardApplicationItem[];
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: string;
  amount: number;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
}

export interface CandidateJobActivity {
  savedJobIds: string[];
  applicationStatusByJobId: Record<string, DashboardApplicationItem["status"]>;
}

const JOB_CARD_SELECT = `
  id,
  position,
  location,
  salary_min,
  salary_max,
  salary_range_text,
  experience,
  qualification,
  vacancy,
  gender,
  job_time,
  responsibilities,
  status,
  company_name,
  company_email,
  interview_contact_number,
  created_at,
  industry,
  skills,
  description,
  benefits
`;

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
};

const formatMoney = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatFileSize = (size: number | null | undefined) => {
  if (!size) {
    return "-";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.round(size / 1024)} KB`;
};

const mapResumeRow = (item: {
  id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  uploaded_at: string;
  is_active: boolean;
}): ResumeItem => ({
  id: item.id,
  name: item.file_name,
  size: formatFileSize(item.file_size_bytes),
  uploadedAt: formatDate(item.uploaded_at),
  isActive: item.is_active,
  filePath: item.file_path,
});

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

const parseSalary = (value: string) => {
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const mapJobRowToCard = (job: {
  id: string;
  position: string;
  location: string;
  experience: string | null;
  qualification: string | null;
  vacancy: number | null;
  gender: string | null;
  job_time: string | null;
  responsibilities: string | null;
  company_name: string;
  company_email: string;
  interview_contact_number: string | null;
  created_at: string;
  industry: string | null;
  skills: string[] | null;
  description: string | null;
  benefits: string[] | null;
  status: "pending" | "approved" | "rejected" | "closed";
  salary_min: number | null;
  salary_max: number | null;
  salary_range_text: string | null;
}): MockJob => ({
  id: job.id,
  position: job.position,
  location: job.location,
  salaryRange:
    job.salary_range_text ||
    [job.salary_min ? formatMoney(job.salary_min) : "", job.salary_max ? formatMoney(job.salary_max) : ""]
      .filter(Boolean)
      .join(" - ") ||
    "Not specified",
  experience: job.experience || "Any experience",
  qualification: job.qualification || "Not specified",
  vacancy: job.vacancy || 1,
  gender: job.gender || "Any",
  jobTime: job.job_time || "Full Time",
  responsibilities: job.responsibilities || "",
  status: job.status === "closed" ? "approved" : job.status,
  companyName: job.company_name,
  companyEmail: job.company_email,
  interviewContact: job.interview_contact_number || "",
  postedAt: formatDate(job.created_at),
  industry: job.industry || "General",
  skills: job.skills || [],
  description: job.description || "",
  benefits: job.benefits || [],
});

export const getDashboardOverview = async (candidateId: string): Promise<DashboardOverview> => {
  const [{ count: totalJobs }, { count: appliedJobs }, { count: savedJobs }, { count: interviewCalls }, { data: recentApplications, error }] =
    await Promise.all([
      supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId),
      supabase.from("saved_jobs").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId),
      supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId).eq("status", "interview"),
      supabase
        .from("job_applications")
        .select(`
          id,
          candidate_id,
          job_id,
          status,
          applied_at,
          job_posts:job_id (position, company_name, location)
        `)
        .eq("candidate_id", candidateId)
        .order("applied_at", { ascending: false })
        .limit(3),
    ]);

  if (error) {
    throw new Error(error.message);
  }

  const mappedApplications: DashboardApplicationItem[] = (recentApplications || []).map((item: any) => ({
    id: item.id,
    candidateId: item.candidate_id,
    jobId: item.job_id,
    candidateName: "Candidate",
    position: item.job_posts?.position || "Untitled role",
    company: item.job_posts?.company_name || "Company",
    location: item.job_posts?.location || "Location",
    appliedAt: formatDate(item.applied_at),
    status: item.status,
  }));

  return {
    totalJobs: totalJobs || 0,
    appliedJobs: appliedJobs || 0,
    savedJobs: savedJobs || 0,
    interviewCalls: interviewCalls || 0,
    recentApplications: mappedApplications,
  };
};

export const getCandidateProfile = async (candidateId: string): Promise<CandidateProfileForm> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      mobile,
      candidate_profiles!inner (
        father_mobile,
        gender,
        dob,
        marital_status,
        languages,
        present_address,
        permanent_address
      )
    `)
    .eq("id", candidateId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const candidateProfile = Array.isArray((data as any).candidate_profiles)
    ? (data as any).candidate_profiles[0]
    : (data as any).candidate_profiles;

  return {
    fullName: data.full_name || "",
    email: data.email || "",
    mobile: data.mobile || "",
    fatherMobile: candidateProfile?.father_mobile || "",
    gender: candidateProfile?.gender || "",
    dob: formatDate(candidateProfile?.dob),
    maritalStatus: candidateProfile?.marital_status || "",
    languages: candidateProfile?.languages || "",
    presentAddress: candidateProfile?.present_address || "",
    permanentAddress: candidateProfile?.permanent_address || "",
  };
};

export const updateCandidateProfile = async (
  candidateId: string,
  profile: CandidateProfileForm,
) => {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: profile.fullName,
      mobile: profile.mobile,
    })
    .eq("id", candidateId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: candidateProfileError } = await supabase
    .from("candidate_profiles")
    .update({
      father_mobile: profile.fatherMobile || null,
      gender: profile.gender || null,
      dob: profile.dob || null,
      marital_status: profile.maritalStatus || null,
      languages: profile.languages || null,
      present_address: profile.presentAddress || null,
      permanent_address: profile.permanentAddress || null,
    })
    .eq("user_id", candidateId);

  if (candidateProfileError) {
    throw new Error(candidateProfileError.message);
  }
};

export const listEducationEntries = async (candidateId: string): Promise<EducationEntry[]> => {
  const { data, error } = await supabase
    .from("candidate_education")
    .select("id, degree, institution, year, percentage")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => ({
    id: item.id,
    degree: item.degree,
    institution: item.institution,
    year: item.year || "",
    percentage: item.percentage || "",
  }));
};

export const addEducationEntry = async (candidateId: string, entry: Omit<EducationEntry, "id">) => {
  const { error } = await supabase.from("candidate_education").insert({
    candidate_id: candidateId,
    degree: entry.degree,
    institution: entry.institution,
    year: entry.year || null,
    percentage: entry.percentage || null,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const deleteEducationEntry = async (candidateId: string, id: string) => {
  const { error } = await supabase
    .from("candidate_education")
    .delete()
    .eq("candidate_id", candidateId)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};

export const listExperienceEntries = async (candidateId: string): Promise<ExperienceEntry[]> => {
  const { data, error } = await supabase
    .from("candidate_experience")
    .select("id, company, designation, from_month, to_month, description")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => ({
    id: item.id,
    company: item.company,
    designation: item.designation,
    from: item.from_month || "",
    to: item.to_month || "",
    description: item.description || "",
  }));
};

export const addExperienceEntry = async (candidateId: string, entry: Omit<ExperienceEntry, "id">) => {
  const { error } = await supabase.from("candidate_experience").insert({
    candidate_id: candidateId,
    company: entry.company,
    designation: entry.designation,
    from_month: entry.from || null,
    to_month: entry.to || null,
    description: entry.description || null,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const deleteExperienceEntry = async (candidateId: string, id: string) => {
  const { error } = await supabase
    .from("candidate_experience")
    .delete()
    .eq("candidate_id", candidateId)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};

export const getCandidateReferences = async (candidateId: string): Promise<CandidateReferenceForm> => {
  const { data, error } = await supabase
    .from("candidate_references")
    .select("reference_kind, full_name, contact_number")
    .eq("candidate_id", candidateId);

  if (error) {
    throw new Error(error.message);
  }

  const family = (data || []).find((item) => item.reference_kind === "family");
  const friend = (data || []).find((item) => item.reference_kind === "friend");

  return {
    familyName: family?.full_name || "",
    familyContact: family?.contact_number || "",
    friendName: friend?.full_name || "",
    friendContact: friend?.contact_number || "",
  };
};

export const upsertCandidateReferences = async (candidateId: string, value: CandidateReferenceForm) => {
  const rows = [
    value.familyName && value.familyContact
      ? {
          candidate_id: candidateId,
          reference_kind: "family",
          full_name: value.familyName,
          contact_number: value.familyContact,
        }
      : null,
    value.friendName && value.friendContact
      ? {
          candidate_id: candidateId,
          reference_kind: "friend",
          full_name: value.friendName,
          contact_number: value.friendContact,
        }
      : null,
  ].filter(Boolean);

  const { error: deleteError } = await supabase
    .from("candidate_references")
    .delete()
    .eq("candidate_id", candidateId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("candidate_references").insert(rows);

    if (error) {
      throw new Error(error.message);
    }
  }
};

export const listResumes = async (candidateId: string): Promise<ResumeItem[]> => {
  const { data, error } = await supabase
    .from("candidate_documents")
    .select("id, file_name, file_path, file_size_bytes, uploaded_at, is_active")
    .eq("candidate_id", candidateId)
    .eq("document_type", "resume")
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapResumeRow);
};

export const uploadResume = async (candidateId: string, file: File): Promise<ResumeItem> => {
  const filePath = `${candidateId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("candidate-resumes")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: insertedResume, error: insertError } = await supabase
    .from("candidate_documents")
    .insert({
      candidate_id: candidateId,
      document_type: "resume",
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type || null,
      file_size_bytes: file.size,
      is_active: false,
    })
    .select("id, file_name, file_path, file_size_bytes, uploaded_at, is_active")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: resetError } = await supabase
    .from("candidate_documents")
    .update({ is_active: false })
    .eq("candidate_id", candidateId)
    .eq("document_type", "resume")
    .neq("id", insertedResume.id);

  if (resetError) {
    throw new Error(resetError.message);
  }

  const { error: activateError } = await supabase
    .from("candidate_documents")
    .update({ is_active: true })
    .eq("candidate_id", candidateId)
    .eq("id", insertedResume.id);

  if (activateError) {
    throw new Error(activateError.message);
  }

  return mapResumeRow({
    ...insertedResume,
    is_active: true,
  });
};

export const setActiveResume = async (candidateId: string, id: string) => {
  const { error: resetError } = await supabase
    .from("candidate_documents")
    .update({ is_active: false })
    .eq("candidate_id", candidateId)
    .eq("document_type", "resume");

  if (resetError) {
    throw new Error(resetError.message);
  }

  const { error } = await supabase
    .from("candidate_documents")
    .update({ is_active: true })
    .eq("candidate_id", candidateId)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};

export const removeResume = async (candidateId: string, id: string, filePath: string) => {
  const { error: storageError } = await supabase.storage.from("candidate-resumes").remove([filePath]);
  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error } = await supabase
    .from("candidate_documents")
    .delete()
    .eq("candidate_id", candidateId)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
};

export const getResumeDownloadUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from("candidate-resumes")
    .createSignedUrl(filePath, 60);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
};

export const listCandidateApplications = async (candidateId: string): Promise<DashboardApplicationItem[]> => {
  const { data, error } = await supabase
    .from("job_applications")
    .select(`
      id,
      candidate_id,
      job_id,
      status,
      applied_at,
      job_posts:job_id (position, company_name, location)
    `)
    .eq("candidate_id", candidateId)
    .order("applied_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    candidateId: item.candidate_id,
    jobId: item.job_id,
    candidateName: "Candidate",
    position: item.job_posts?.position || "Untitled role",
    company: item.job_posts?.company_name || "Company",
    location: item.job_posts?.location || "Location",
    appliedAt: formatDate(item.applied_at),
    status: item.status,
  }));
};

export interface JobFiltersInput {
  keyword: string;
  city: string;
  experience: string;
  category: string;
}

export const getCandidateJobActivity = async (
  candidateId: string,
  jobIds: string[],
): Promise<CandidateJobActivity> => {
  if (jobIds.length === 0) {
    return {
      savedJobIds: [],
      applicationStatusByJobId: {},
    };
  }

  const [{ data: savedJobs, error: savedError }, { data: applications, error: applicationError }] =
    await Promise.all([
      supabase.from("saved_jobs").select("job_id").eq("candidate_id", candidateId).in("job_id", jobIds),
      supabase
        .from("job_applications")
        .select("job_id, status")
        .eq("candidate_id", candidateId)
        .in("job_id", jobIds),
    ]);

  if (savedError) {
    throw new Error(savedError.message);
  }

  if (applicationError) {
    throw new Error(applicationError.message);
  }

  return {
    savedJobIds: (savedJobs || []).map((item) => item.job_id),
    applicationStatusByJobId: (applications || []).reduce<Record<string, DashboardApplicationItem["status"]>>(
      (accumulator, item) => {
        accumulator[item.job_id] = item.status;
        return accumulator;
      },
      {},
    ),
  };
};

export const listApprovedJobs = async (filters: JobFiltersInput): Promise<MockJob[]> => {
  const cacheKey = createApprovedJobsCacheKey(filters);
  const cached = approvedJobsCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < APPROVED_JOBS_CACHE_TTL_MS) {
    return cached.data;
  }

  let query = supabase
    .from("job_posts")
    .select(JOB_CARD_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (filters.keyword.trim()) {
    query = query.ilike("position", `%${filters.keyword.trim()}%`);
  }

  if (filters.city !== "All Cities") {
    query = query.eq("location", filters.city);
  }

  if (filters.category !== "All Categories") {
    query = query.eq("industry", filters.category);
  }

  if (filters.experience !== "Any Experience") {
    query = query.eq("experience", filters.experience);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data || []).map(mapJobRowToCard);
  approvedJobsCache.set(cacheKey, { timestamp: now, data: mapped });
  return mapped;
};

export const listRecentApprovedJobs = async (limit: number): Promise<MockJob[]> => {
  const normalizedLimit = Math.max(1, Math.min(20, limit));
  const cacheKey = JSON.stringify({ recent: true, limit: normalizedLimit });
  const cached = approvedJobsCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < APPROVED_JOBS_CACHE_TTL_MS) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from("job_posts")
    .select(JOB_CARD_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(normalizedLimit);

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data || []).map(mapJobRowToCard);
  approvedJobsCache.set(cacheKey, { timestamp: now, data: mapped });
  return mapped;
};

export const getApprovedJobById = async (id: string): Promise<MockJob | null> => {
  const { data, error } = await supabase
    .from("job_posts")
    .select(JOB_CARD_SELECT)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapJobRowToCard(data) : null;
};

export const listSavedJobs = async (candidateId: string): Promise<MockJob[]> => {
  const { data, error } = await supabase
    .from("saved_jobs")
    .select(`
      job_id,
      created_at,
      job_posts:job_id!inner (${JOB_CARD_SELECT})
    `)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || [])
    .map((item: any) => item.job_posts)
    .filter(Boolean)
    .map(mapJobRowToCard);
};

export const saveJob = async (candidateId: string, jobId: string) => {
  const { error } = await supabase.from("saved_jobs").insert({
    candidate_id: candidateId,
    job_id: jobId,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Job already saved");
    }
    throw new Error(error.message);
  }
};

export const removeSavedJob = async (candidateId: string, jobId: string) => {
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId);

  if (error) {
    throw new Error(error.message);
  }
};

export const applyToJob = async (
  candidateId: string,
  jobId: string,
  resumeDocumentId?: string,
) => {
  const isPaymentEnabled = await getPaymentSystemEnabled();
  if (isPaymentEnabled) {
    const hasPaid = await checkCandidatePaymentVerified(candidateId);
    if (!hasPaid) {
      throw new Error("Please complete payment to apply for jobs.");
    }
  }

  let selectedResumeId = resumeDocumentId || null;

  if (!selectedResumeId) {
    const { data: activeResume, error: resumeError } = await supabase
      .from("candidate_documents")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("document_type", "resume")
      .eq("is_active", true)
      .maybeSingle();

    if (resumeError) {
      throw new Error(resumeError.message);
    }

    selectedResumeId = activeResume?.id || null;
  }

  const { error } = await supabase.from("job_applications").insert({
    candidate_id: candidateId,
    job_id: jobId,
    resume_document_id: selectedResumeId,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already applied for this job");
    }
    throw new Error(error.message);
  }

  // Send application confirmation email to candidate
  try {
    const [candidateData, jobData] = await Promise.all([
      supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", candidateId)
        .single(),
      supabase
        .from("job_posts")
        .select("id, position, company_name")
        .eq("id", jobId)
        .single(),
    ]);

    if (candidateData.data?.email && jobData.data) {
      await sendCandidateApplicationStatusEmail({
        candidateEmail: candidateData.data.email,
        candidateName: candidateData.data.full_name || "Candidate",
        jobPosition: jobData.data.position,
        companyName: jobData.data.company_name,
        applicationStatus: "applied",
        applicationId: jobId,
        jobId: jobId,
      });
    }
  } catch (emailError) {
    console.warn("Application confirmation email failed:", emailError);
    // Don't throw - application was successful, just email notification failed
  }
};

export const listPaymentPlans = async (): Promise<PaymentPlan[]> => {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id, slug, name, amount, billing_label, description, features")
    .eq("is_active", true)
    .order("amount", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: formatMoney(plan.amount) || `₹${plan.amount}`,
    amount: plan.amount,
    period: plan.billing_label || "one time",
    description: plan.description || "",
    features: plan.features || [],
    popular: plan.slug === "highlighted-profile",
  }));
};

export const submitPaymentProof = async (
  candidateId: string,
  planId: string,
  amount: number,
  utrNumber: string,
  screenshot: File,
) => {
  const filePath = `${candidateId}/${Date.now()}-${sanitizeFileName(screenshot.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-screenshots")
    .upload(filePath, screenshot, { upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: docRow, error: docError } = await supabase
    .from("candidate_documents")
    .insert({
      candidate_id: candidateId,
      document_type: "payment_screenshot",
      file_name: screenshot.name,
      file_path: filePath,
      mime_type: screenshot.type || null,
      file_size_bytes: screenshot.size,
      is_active: false,
    })
    .select("id")
    .single();

  if (docError) {
    throw new Error(docError.message);
  }

  const { error } = await supabase.from("candidate_payments").insert({
    candidate_id: candidateId,
    plan_id: planId,
    amount,
    payment_method: "upi",
    status: "submitted",
    utr_number: utrNumber,
    paid_at: new Date().toISOString(),
    screenshot_file_path: filePath,
    screenshot_document_id: docRow.id,
    transaction_reference: utrNumber,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const checkCandidatePaymentVerified = async (candidateId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("candidate_payments")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("status", "verified")
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return data !== null;
};

export const getDefaultPlan = async (): Promise<PaymentPlan | null> => {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id, slug, name, amount, billing_label, description, features")
    .eq("is_active", true)
    .order("amount", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    price: formatMoney(data.amount) || `₹${data.amount}`,
    amount: data.amount,
    period: data.billing_label || "year",
    description: data.description || "",
    features: data.features || [],
    popular: false,
  };
};

export const mapRegistrationProfileToDashboardProfile = (
  profile: RegistrationCandidateProfile,
  email: string,
): CandidateProfileForm => ({
  fullName: profile.fullName,
  email,
  mobile: profile.mobile,
  fatherMobile: profile.fatherMobile,
  gender: profile.gender,
  dob: profile.dob,
  maritalStatus: profile.maritalStatus,
  languages: profile.languages,
  presentAddress: profile.presentAddress,
  permanentAddress: profile.permanentAddress,
});
