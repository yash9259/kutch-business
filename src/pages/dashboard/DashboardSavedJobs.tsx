import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import JobCard from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  applyToJob,
  getCandidateJobActivity,
  listResumes,
  listSavedJobs,
  removeSavedJob,
  type DashboardApplicationItem,
  type ResumeItem,
} from "@/lib/candidateDashboard";
import type { Job } from "@/lib/mockData";

const DashboardSavedJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savePendingJobId, setSavePendingJobId] = useState<string | null>(null);
  const [applyPendingJobId, setApplyPendingJobId] = useState<string | null>(null);
  const [applicationStatusByJobId, setApplicationStatusByJobId] = useState<Record<string, DashboardApplicationItem["status"]>>({});

  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [resumeItems, setResumeItems] = useState<ResumeItem[]>([]);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  const [resumeFilter, setResumeFilter] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadSavedJobs = async () => {
      try {
        setIsLoading(true);
        const saved = await listSavedJobs(user.id);
        setJobs(saved);

        const activity = await getCandidateJobActivity(
          user.id,
          saved.map((job) => job.id),
        );
        setApplicationStatusByJobId(activity.applicationStatusByJobId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load saved jobs");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSavedJobs();
  }, [user?.id]);

  const handleUnsave = async (jobId: string) => {
    if (!user?.id) {
      return;
    }

    const previousJobs = jobs;

    try {
      setSavePendingJobId(jobId);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      await removeSavedJob(user.id, jobId);
      toast.success("Job removed from saved list");
    } catch (error) {
      setJobs(previousJobs);
      toast.error(error instanceof Error ? error.message : "Unable to remove saved job");
    } finally {
      setSavePendingJobId(null);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user?.id) {
      navigate("/login");
      return;
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

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold text-foreground mb-1">Saved Jobs</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Jobs you bookmarked are listed here.
      </p>

      <div className="space-y-3">
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
        ) : jobs.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">
            No saved jobs yet. Go to Browse Jobs and click Save on any job card.
          </p>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
              onSave={handleUnsave}
              isSaved
              applicationStatus={applicationStatusByJobId[job.id]}
              isApplyPending={applyPendingJobId === job.id}
              isSavePending={savePendingJobId === job.id}
            />
          ))
        )}
      </div>

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

export default DashboardSavedJobs;
