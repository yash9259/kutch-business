import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import JobCard from "@/components/jobs/JobCard";
import JobFilters from "@/components/jobs/JobFilters";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import { useNavigate } from "react-router-dom";
import {
  applyToJob,
  checkCandidatePaymentVerified,
  getCandidateJobActivity,
  listResumes,
  listApprovedJobs,
  removeSavedJob,
  saveJob,
  type DashboardApplicationItem,
  type ResumeItem,
} from "@/lib/candidateDashboard";
import type { Job } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 5;

const DashboardJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnabled: isPaymentEnabled } = usePaymentSystem();
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("All Cities");
  const [experience, setExperience] = useState("Any Experience");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [applicationStatusByJobId, setApplicationStatusByJobId] = useState<Record<string, DashboardApplicationItem["status"]>>({});
  const [savePendingJobId, setSavePendingJobId] = useState<string | null>(null);
  const [applyPendingJobId, setApplyPendingJobId] = useState<string | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [resumeItems, setResumeItems] = useState<ResumeItem[]>([]);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  const [resumeFilter, setResumeFilter] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        const nextJobs = await listApprovedJobs({ keyword, city, experience, category });
        setJobs(nextJobs);

        if (user?.id) {
          const activity = await getCandidateJobActivity(
            user.id,
            nextJobs.map((job) => job.id),
          );
          setSavedJobIds(activity.savedJobIds);
          setApplicationStatusByJobId(activity.applicationStatusByJobId);
        } else {
          setSavedJobIds([]);
          setApplicationStatusByJobId({});
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load jobs");
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobs();
  }, [keyword, city, experience, category, user?.id]);

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const paginated = jobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleApply = async (jobId: string) => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (isPaymentEnabled) {
      const hasPaid = await checkCandidatePaymentVerified(user.id);
      if (!hasPaid) {
        toast.error("Please complete payment to apply for jobs.");
        navigate("/dashboard/payment");
        return;
      }
    }

    setSelectedJobId(jobId);
    setResumeFilter("");
    setSelectedResumeId(null);
    setIsApplyDialogOpen(true);

    try {
      setIsResumeLoading(true);
      const resumes = await listResumes(user.id);
      setResumeItems(resumes);
      const activeResume = resumes.find((item) => item.isActive);
      setSelectedResumeId(activeResume?.id || resumes[0]?.id || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load resumes");
    } finally {
      setIsResumeLoading(false);
    }
  };

  const submitApplyWithSelectedResume = async () => {
    if (!user?.id || !selectedJobId) {
      return;
    }

    if (!selectedResumeId) {
      toast.error("Please upload or select a resume first");
      return;
    }

    const previousStatus = applicationStatusByJobId[selectedJobId];

    try {
      setApplyPendingJobId(selectedJobId);
      setApplicationStatusByJobId((prev) => ({ ...prev, [selectedJobId]: "applied" }));
      await applyToJob(user.id, selectedJobId, selectedResumeId);
      toast.success("Application submitted!");
      setIsApplyDialogOpen(false);
      setSelectedJobId(null);
    } catch (error) {
      setApplicationStatusByJobId((prev) => {
        const next = { ...prev };
        if (previousStatus) {
          next[selectedJobId] = previousStatus;
        } else {
          delete next[selectedJobId];
        }
        return next;
      });
      toast.error(error instanceof Error ? error.message : "Unable to apply");
    } finally {
      setApplyPendingJobId(null);
    }
  };

  const filteredResumes = resumeItems.filter((item) => {
    const normalized = resumeFilter.trim().toLowerCase();
    if (!normalized) return true;
    return item.name.toLowerCase().includes(normalized);
  });

  const handleSave = async (jobId: string) => {
    if (!user?.id) {
      toast.error("Please login first");
      return;
    }

    const wasSaved = savedJobIds.includes(jobId);

    try {
      setSavePendingJobId(jobId);
      setSavedJobIds((prev) =>
        wasSaved ? prev.filter((savedJobId) => savedJobId !== jobId) : [...prev, jobId],
      );

      if (wasSaved) {
        await removeSavedJob(user.id, jobId);
        toast.success("Job removed from saved list");
      } else {
        await saveJob(user.id, jobId);
        toast.success("Job saved!");
      }
    } catch (error) {
      setSavedJobIds((prev) =>
        wasSaved ? [...prev, jobId] : prev.filter((savedJobId) => savedJobId !== jobId),
      );
      toast.error(error instanceof Error ? error.message : "Unable to save job");
    } finally {
      setSavePendingJobId(null);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold text-foreground mb-1">Browse Jobs</h1>
      <p className="text-sm text-muted-foreground mb-5">{jobs.length} open positions</p>

      <JobFilters
        keyword={keyword} city={city} experience={experience} category={category}
        onKeywordChange={(v) => { setKeyword(v); setPage(1); }}
        onCityChange={(v) => { setCity(v); setPage(1); }}
        onExperienceChange={setExperience}
        onCategoryChange={setCategory}
      />

      <div className="mt-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-card p-5 sm:p-6 rounded-xl shadow-card flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full max-w-sm" />
              </div>
              <div className="space-y-3 sm:w-40">
                <Skeleton className="h-5 w-24 ml-auto" />
                <div className="flex gap-2 justify-end">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : paginated.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No jobs found.</p>
        ) : paginated.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onApply={handleApply}
            onSave={handleSave}
            isSaved={savedJobIds.includes(job.id)}
            applicationStatus={applicationStatusByJobId[job.id]}
            isApplyPending={applyPendingJobId === job.id}
            isSavePending={savePendingJobId === job.id}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Resume to Apply</DialogTitle>
            <DialogDescription>
              Choose which uploaded resume you want to use for this application.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Search resume file"
            value={resumeFilter}
            onChange={(e) => setResumeFilter(e.target.value)}
          />

          <div className="max-h-72 overflow-y-auto space-y-2">
            {isResumeLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)
            ) : filteredResumes.length === 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                No resumes found. Please upload a resume in Dashboard Resume section.
              </div>
            ) : (
              filteredResumes.map((resume) => (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => setSelectedResumeId(resume.id)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    selectedResumeId === resume.id ? "border-primary bg-accent" : "border-border hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{resume.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {resume.size} • Uploaded {resume.uploadedAt}{resume.isActive ? " • Active" : ""}
                  </p>
                </button>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={submitApplyWithSelectedResume}
              disabled={!selectedResumeId || Boolean(applyPendingJobId)}
            >
              {applyPendingJobId ? "Applying..." : "Apply with Selected Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardJobs;
