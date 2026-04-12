import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { updateJobStatusWithEmail } from "@/lib/employerJobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface JobPost {
  id: string;
  position: string;
  company_name: string;
  company_email: string;
  location: string;
  salary_range_text: string | null;
  job_time: string;
  responsibilities: string | null;
  experience: string | null;
  qualification: string | null;
  vacancy: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const JobReview = () => {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("job_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleApprove = (job: JobPost) => {
    setSelectedJob(job);
    setActionType("approve");
    setRejectionReason("");
    setIsDialogOpen(true);
  };

  const handleReject = (job: JobPost) => {
    setSelectedJob(job);
    setActionType("reject");
    setRejectionReason("");
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedJob) return;

    try {
      setIsProcessing(true);
      await updateJobStatusWithEmail(
        selectedJob.id,
        actionType === "approve" ? "approved" : "rejected",
        actionType === "reject" ? rejectionReason : undefined
      );

      toast.success(
        actionType === "approve"
          ? "Job approved! Email sent to employer."
          : "Job rejected! Email sent to employer."
      );

      setJobs((prev) =>
        prev.map((job) =>
          job.id === selectedJob.id
            ? { ...job, status: actionType === "approve" ? "approved" : "rejected" }
            : job
        )
      );

      setIsDialogOpen(false);
      setSelectedJob(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update job status");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job submissions...</p>
        </div>
      </div>
    );
  }

  const pendingJobs = jobs.filter((j) => j.status === "pending");
  const approvedJobs = jobs.filter((j) => j.status === "approved");
  const rejectedJobs = jobs.filter((j) => j.status === "rejected");

  return (
    <div className="container py-10 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Job Review</h1>
        <p className="text-muted-foreground">Review and manage employer job submissions</p>
      </div>

      {/* Pending Jobs */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-yellow-600" />
          <h2 className="text-xl font-semibold">Pending ({pendingJobs.length})</h2>
        </div>
        {pendingJobs.length === 0 ? (
          <div className="bg-card rounded-lg p-6 text-center text-muted-foreground">
            No pending jobs
          </div>
        ) : (
          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg p-6 border border-border"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{job.position}</h3>
                        <p className="text-muted-foreground">{job.company_name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Location: </span>
                        <span className="font-medium">{job.location}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vacancy: </span>
                        <span className="font-medium">{job.vacancy}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Job Type: </span>
                        <span className="font-medium">{job.job_time}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Salary: </span>
                        <span className="font-medium">{job.salary_range_text || "Not specified"}</span>
                      </div>
                      {job.experience && (
                        <div>
                          <span className="text-muted-foreground">Experience: </span>
                          <span className="font-medium">{job.experience}</span>
                        </div>
                      )}
                      {job.qualification && (
                        <div>
                          <span className="text-muted-foreground">Qualification: </span>
                          <span className="font-medium">{job.qualification}</span>
                        </div>
                      )}
                    </div>

                    {job.responsibilities && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Job Description:</p>
                        <p className="text-sm text-foreground bg-surface/50 p-2 rounded line-clamp-3">
                          {job.responsibilities}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Contact: </span>
                        {job.company_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => handleApprove(job)}
                      variant="outline"
                      className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 text-sm"
                      disabled={isProcessing}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>

                    <Button
                      onClick={() => handleReject(job)}
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 text-sm"
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Jobs */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Approved ({approvedJobs.length})</h2>
        </div>
        {approvedJobs.length === 0 ? (
          <div className="bg-card rounded-lg p-6 text-center text-muted-foreground">
            No approved jobs
          </div>
        ) : (
          <div className="space-y-2">
            {approvedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-card rounded-lg p-4 border border-green-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{job.position}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.company_name} • {job.location}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Jobs */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <XCircle className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-semibold">Rejected ({rejectedJobs.length})</h2>
        </div>
        {rejectedJobs.length === 0 ? (
          <div className="bg-card rounded-lg p-6 text-center text-muted-foreground">
            No rejected jobs
          </div>
        ) : (
          <div className="space-y-2">
            {rejectedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-card rounded-lg p-4 border border-red-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{job.position}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.company_name} • {job.location}
                  </p>
                </div>
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval/Rejection Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Job Posting" : "Reject Job Posting"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedJob && `Position: ${selectedJob.position} at ${selectedJob.company_name}`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionType === "reject" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="reason">Reason for rejection</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this job posting is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          {actionType === "approve" && (
            <div className="text-sm text-muted-foreground">
              The employer will receive an approval email with a link to view their job posting on the platform.
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isProcessing || (actionType === "reject" && !rejectionReason.trim())}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isProcessing ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobReview;
