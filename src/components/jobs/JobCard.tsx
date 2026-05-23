import { motion } from "framer-motion";
import { MapPin, Clock, Briefcase, ChevronRight } from "lucide-react";
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
      return "Interview Callback";
    case "rejected":
      return "Rejected";
    case "hired":
      return "Hired 🎉";
    case "withdrawn":
      return "Withdrawn";
    case "applied":
      return "Applied";
    default:
      return "Apply Now";
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
    whileHover={{ y: -3 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="bg-card p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-border/70 hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative overflow-hidden group"
  >
    {/* Left glowing accent bar on hover */}
    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-primary via-red-500 to-primary transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 pointer-events-none" />
    
    {/* Sweeping light shine effect on card hover */}
    <div className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out pointer-events-none" />

    <div className="space-y-3 min-w-0 flex-1 pl-1">
      <Link to={`/jobs/${job.id}`} className="inline-block group/link max-w-full">
        <h3 className="text-lg font-bold text-foreground group-hover/link:text-primary transition-colors truncate flex items-center gap-1.5">
          <span>{job.position}</span>
          <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-primary shrink-0" />
        </h3>
      </Link>
      
      <p className="text-sm font-semibold text-muted-foreground/90">{job.companyName}</p>

      {/* Styled badge pills */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="flex items-center gap-1.5 bg-surface border border-border/60 text-muted-foreground px-3 py-1.5 rounded-xl shadow-sm">
          <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5 bg-surface border border-border/60 text-muted-foreground px-3 py-1.5 rounded-xl shadow-sm">
          <Briefcase className="h-3.5 w-3.5 text-primary/70 shrink-0" />
          {job.experience}
        </span>
        <span className="flex items-center gap-1.5 bg-surface border border-border/60 text-muted-foreground px-3 py-1.5 rounded-xl shadow-sm">
          <Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
          {job.jobTime}
        </span>
      </div>
    </div>
    
    <div className="flex sm:flex-col items-center sm:items-end gap-3 justify-between sm:justify-start border-t sm:border-t-0 border-border/60 pt-3 sm:pt-0 pl-1 shrink-0">
      <div className="flex flex-col sm:items-end">
        <span className="text-xs text-muted-foreground font-semibold">Offered Salary</span>
        <p className="text-lg font-extrabold text-primary tabular-nums whitespace-nowrap tracking-tight">
          {job.salaryRange}
        </p>
      </div>
      
      {showActions && (
        <div className="flex gap-2">
          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="sm"
            disabled={isSavePending}
            onClick={() => onSave?.(job.id)}
            className="h-10 px-4 font-bold rounded-xl border-border bg-card shadow-sm hover:bg-surface active:scale-95 transition-all text-xs shrink-0"
          >
            {isSavePending ? "Saving..." : isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            variant={applicationStatus ? "secondary" : "default"}
            disabled={Boolean(applicationStatus) || isApplyPending}
            onClick={() => onApply?.(job.id)}
            className="h-10 px-5 font-bold rounded-xl shadow-sm active:scale-95 transition-all text-xs shrink-0"
          >
            {isApplyPending ? "Applying..." : getApplicationButtonLabel(applicationStatus)}
          </Button>
        </div>
      )}
    </div>
  </motion.div>
);

export default JobCard;
