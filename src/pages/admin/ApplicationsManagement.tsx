import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { sendCandidateApplicationStatusEmail } from "@/lib/employerJobs";

type ApplicationStatus = "applied" | "shortlisted" | "interview" | "rejected" | "hired" | "withdrawn";

interface AppRow {
  id: string;
  candidateId: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  company: string;
  appliedAt: string;
  status: ApplicationStatus;
  resumePath: string | null;
  resumeName: string;
}

const statusVariant = (status: string) => {
  if (status === "rejected") return "destructive" as const;
  if (status === "interview") return "secondary" as const;
  return "outline" as const;
};

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusDraftById, setStatusDraftById] = useState<Record<string, ApplicationStatus>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const { data: appRows, error: appError } = await supabase
          .from("job_applications")
          .select("id, candidate_id, job_id, resume_document_id, status, applied_at")
          .order("applied_at", { ascending: false });

        if (appError) throw appError;

        const candidateIds = Array.from(new Set((appRows || []).map((row) => row.candidate_id)));
        const jobIds = Array.from(new Set((appRows || []).map((row) => row.job_id)));
        const resumeIds = Array.from(
          new Set((appRows || []).map((row) => row.resume_document_id).filter(Boolean)),
        ) as string[];

        const [{ data: profiles, error: profileError }, { data: jobs, error: jobsError }, { data: resumes, error: resumeError }] = await Promise.all([
          candidateIds.length > 0
            ? supabase.from("profiles").select("id, full_name, email, role").in("id", candidateIds)
            : Promise.resolve({ data: [], error: null }),
          jobIds.length > 0
            ? supabase.from("job_posts").select("id, position, company_name").in("id", jobIds)
            : Promise.resolve({ data: [], error: null }),
          resumeIds.length > 0
            ? supabase.from("candidate_documents").select("id, file_path, file_name").in("id", resumeIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (profileError) throw profileError;
        if (jobsError) throw jobsError;
        if (resumeError) throw resumeError;

        const profileById = new Map((profiles || []).map((row) => [row.id, row.full_name]));
        const emailById = new Map((profiles || []).map((row: any) => [row.id, row.email]));
        const roleById = new Map((profiles || []).map((row: any) => [row.id, row.role]));
        const jobById = new Map((jobs || []).map((row) => [row.id, row]));
        const resumeById = new Map((resumes || []).map((row) => [row.id, row]));

        const mappedApplications: AppRow[] = (appRows || [])
            .filter((row) => (roleById.get(row.candidate_id) || "candidate") === "candidate")
            .map((row) => {
            const job = jobById.get(row.job_id);
            const resume = row.resume_document_id ? resumeById.get(row.resume_document_id) : null;
            return {
              id: row.id,
              candidateId: row.candidate_id,
              jobId: row.job_id,
              candidateName: profileById.get(row.candidate_id) || "Unknown",
              candidateEmail: emailById.get(row.candidate_id) || "",
              position: job?.position || "-",
              company: job?.company_name || "-",
              appliedAt: row.applied_at ? new Date(row.applied_at).toLocaleDateString("en-IN") : "-",
              status: (row.status || "applied") as ApplicationStatus,
              resumePath: resume?.file_path || null,
              resumeName: resume?.file_name || "Resume not attached",
            };
          });

        setApplications(mappedApplications);
        setStatusDraftById(
          mappedApplications.reduce<Record<string, ApplicationStatus>>((accumulator, item) => {
            accumulator[item.id] = item.status;
            return accumulator;
          }, {}),
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load applications");
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredApplications = applications.filter((item) => {
    const keywordMatch =
      !normalizedKeyword ||
      item.candidateName.toLowerCase().includes(normalizedKeyword) ||
      item.position.toLowerCase().includes(normalizedKeyword) ||
      item.company.toLowerCase().includes(normalizedKeyword);
    const statusMatch = statusFilter === "all" || item.status === statusFilter;
    return keywordMatch && statusMatch;
  });

  const downloadResume = async (application: AppRow) => {
    if (!application.resumePath) {
      toast.info("No resume attached for this application");
      return;
    }

    setDownloadingId(application.id);
    try {
      const { data, error } = await supabase.storage
        .from("candidate-resumes")
        .createSignedUrl(application.resumePath, 60);
      if (error || !data?.signedUrl) {
        throw new Error("Failed to create resume link");
      }
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download resume");
    } finally {
      setDownloadingId(null);
    }
  };

  const updateApplicationStatus = async (application: AppRow) => {
    const nextStatus = statusDraftById[application.id] || application.status;

    if (nextStatus === application.status) {
      toast.info("Status is already up to date");
      return;
    }

    const updatePayload: Record<string, string | null> = {
      status: nextStatus,
      shortlisted_at: nextStatus === "shortlisted" ? new Date().toISOString() : null,
      interview_at: nextStatus === "interview" ? new Date().toISOString() : null,
      rejected_at: nextStatus === "rejected" ? new Date().toISOString() : null,
    };

    setUpdatingId(application.id);
    try {
      const { error } = await supabase
        .from("job_applications")
        .update(updatePayload)
        .eq("id", application.id);

      if (error) throw error;

      setApplications((prev) => prev.map((item) => (
        item.id === application.id ? { ...item, status: nextStatus } : item
      )));

      // Only send email notification when status is "applied", not for other status changes
      if (nextStatus === "applied" && application.candidateEmail) {
        try {
          await sendCandidateApplicationStatusEmail({
            candidateEmail: application.candidateEmail,
            candidateName: application.candidateName,
            jobPosition: application.position,
            companyName: application.company,
            applicationStatus: nextStatus,
            applicationId: application.id,
            jobId: application.jobId,
          });
        } catch (emailError) {
          console.warn("Candidate status email failed:", emailError);
        }
      }

      toast.success("Application status updated");
    } catch (error) {
      setStatusDraftById((prev) => ({ ...prev, [application.id]: application.status }));
      toast.error(error instanceof Error ? error.message : "Failed to update application status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Applications Management</h1>
          <p className="text-sm text-muted-foreground">Track candidate, job, date, and application status</p>
        </div>
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Applications Management</h1>
        <p className="text-sm text-muted-foreground">Track candidate, job, date, and application status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search candidate, position, company"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="sm:col-span-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Status</option>
          <option value="applied">Applied</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {filteredApplications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <>
          <div className="sm:hidden space-y-3">
            {filteredApplications.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">{item.candidateName}</p>
                <p className="text-xs text-muted-foreground">{item.position} • {item.company}</p>
                <p className="text-xs text-muted-foreground">Applied: {item.appliedAt}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  <select
                    value={statusDraftById[item.id] || item.status}
                    onChange={(e) => setStatusDraftById((prev) => ({ ...prev, [item.id]: e.target.value as ApplicationStatus }))}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="w-full"
                  onClick={() => updateApplicationStatus(item)}
                  disabled={updatingId === item.id}
                >
                  {updatingId === item.id ? "Updating..." : "Update Status"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  disabled={!item.resumePath || downloadingId === item.id}
                  onClick={() => downloadResume(item)}
                >
                  {downloadingId === item.id ? "Opening..." : "Download Applied Resume"}
                </Button>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Candidate</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Job</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Company</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Application Date</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Update</th>
                  <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Resume</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="p-3 text-sm font-medium">{item.candidateName}</td>
                    <td className="p-3 text-sm text-muted-foreground">{item.position}</td>
                    <td className="p-3 text-sm text-muted-foreground">{item.company}</td>
                    <td className="p-3 text-sm text-muted-foreground">{item.appliedAt}</td>
                    <td className="p-3 text-sm"><Badge variant={statusVariant(item.status)}>{item.status}</Badge></td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <select
                          value={statusDraftById[item.id] || item.status}
                          onChange={(e) => setStatusDraftById((prev) => ({ ...prev, [item.id]: e.target.value as ApplicationStatus }))}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => updateApplicationStatus(item)}
                          disabled={updatingId === item.id}
                        >
                          {updatingId === item.id ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!item.resumePath || downloadingId === item.id}
                        onClick={() => downloadResume(item)}
                      >
                        {downloadingId === item.id ? "Opening..." : "Download"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default ApplicationsManagement;
