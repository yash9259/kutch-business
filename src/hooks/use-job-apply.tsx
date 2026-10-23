import { useState } from "react";
import { toast } from "sonner";
import ApplyDialog, { type ApplyTarget } from "@/components/jobs/ApplyDialog";
import { useAuth } from "@/hooks/use-auth";
import { applyToJob } from "@/lib/candidateDashboard";

// Public apply flow used by Home, Jobs, City pages and Job detail.
// Logged-in candidates apply in one tap (their active resume is attached).
// Everyone else gets the quick form. Both land in the same applications table.
export const useJobApply = () => {
  const { user } = useAuth();
  const [target, setTarget] = useState<ApplyTarget | null>(null);

  const startApply = async (job: ApplyTarget) => {
    if (user?.id && user.role === "candidate") {
      try {
        await applyToJob(user.id, job.id);
        toast.success("Application submitted!");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to apply");
      }
      return;
    }
    setTarget(job);
  };

  const applyDialog = <ApplyDialog job={target} onClose={() => setTarget(null)} />;

  return { startApply, applyDialog };
};
