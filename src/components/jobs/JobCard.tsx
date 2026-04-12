import { motion } from "framer-motion";
import { MapPin, Clock, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Job } from "@/lib/mockData";

interface JobCardProps {
  job: Job;
  showActions?: boolean;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
  applicationStatus?: "applied" | "shortlisted" | "interview" | "rejected" | "hired" | "withdrawn";
  isApplyPending?: boolean;
  isSavePending?: boolean;
}

const getApplicationButtonLabel = (status?: JobCardProps["applicationStatus"]) => {
  switch (status) {
    case "shortlisted":
      return "Shortlisted";
    case "interview":
      return "Interview";
    case "rejected":
      return "Rejected";
    case "hired":
      return "Hired";
    case "withdrawn":
      return "Withdrawn";
    case "applied":
      return "Applied";
    default:
      return "Apply";
  }
};

const JobCard = ({
  job,
  showActions = true,
  onApply,
  onSave,
  isSaved = false,
  applicationStatus,
  isApplyPending = false,
  isSavePending = false,
}: JobCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    className="bg-card p-5 sm:p-6 rounded-xl shadow-card hover:shadow-card-hover transition-shadow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
  >
    <div className="space-y-1.5 min-w-0 flex-1">
      <Link to={`/jobs/${job.id}`}>
        <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate">
          {job.position}
        </h3>
      </Link>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          {job.experience}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {job.jobTime}
        </span>
      </div>
    </div>
    <div className="flex sm:flex-col items-center sm:items-end gap-3">
      <p className="text-base font-bold text-primary tabular-nums whitespace-nowrap">
        {job.salaryRange}
      </p>
      {showActions && (
        <div className="flex gap-2">
          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="sm"
            disabled={isSavePending}
            onClick={() => onSave?.(job.id)}
          >
            {isSavePending ? "Saving..." : isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            variant={applicationStatus ? "secondary" : "default"}
            disabled={Boolean(applicationStatus) || isApplyPending}
            onClick={() => onApply?.(job.id)}
          >
            {isApplyPending ? "Applying..." : getApplicationButtonLabel(applicationStatus)}
          </Button>
        </div>
      )}
    </div>
  </motion.div>
);

export default JobCard;
