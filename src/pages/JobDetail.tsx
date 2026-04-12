import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import type { Job } from "@/lib/mockData";
import { getApprovedJobById, listRecentApprovedJobs } from "@/lib/candidateDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MapPin, Clock, Briefcase, Users, GraduationCap,
  Calendar, Bookmark, Share2, Flag, Building2, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import JobCard from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import { checkCandidatePaymentVerified } from "@/lib/candidateDashboard";

const JobDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnabled: isPaymentEnabled } = usePaymentSystem();
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [allApprovedJobs, setAllApprovedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) {
        setJob(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [jobData, jobs] = await Promise.all([
          getApprovedJobById(id),
          listRecentApprovedJobs(8),
        ]);
        setJob(jobData);
        setAllApprovedJobs(jobs);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load job");
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const similarJobs = useMemo(
    () => allApprovedJobs.filter((j) => j.id !== id).slice(0, 3),
    [allApprovedJobs, id],
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 sm:py-10 space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[240px] rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Job not found</h1>
          <Link to="/jobs" className="text-primary hover:underline text-sm">Back to jobs</Link>
        </div>
      </Layout>
    );
  }

  const postedDays = Math.floor(
    (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const infoItems = [
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Briefcase, label: "Experience", value: job.experience },
    { icon: Clock, label: "Job Type", value: job.jobTime },
    { icon: Users, label: "Openings", value: `${job.vacancy}` },
    { icon: GraduationCap, label: "Qualification", value: job.qualification },
    { icon: Calendar, label: "Posted", value: `${postedDays} day${postedDays !== 1 ? "s" : ""} ago` },
  ];

  const handleApply = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (user.role !== "candidate") {
      toast.error("Only candidates can apply for jobs.");
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

    navigate("/dashboard/jobs");
  };

  return (
    <Layout>
      <div className="bg-surface border-b border-border">
        <div className="container py-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to jobs
          </Link>
        </div>
      </div>

      <div className="container py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl shadow-card overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="h-1.5 bg-primary" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Company avatar */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface border border-border shrink-0">
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                      {job.position}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.location} · {job.jobTime} · {job.industry}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {job.salaryRange}
                      </span>
                      <span className="text-xs text-muted-foreground">/year</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
                  <Button
                    size="lg"
                    onClick={handleApply}
                  >
                    Apply Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toast.info("Please login to save")}
                    className="gap-2"
                  >
                    <Bookmark className="h-4 w-4" /> Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Job details */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl shadow-card p-6 sm:p-8 space-y-8"
            >
              {/* Description */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">
                  About the Role
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">
                  Responsibilities
                </h2>
                <ul className="space-y-2">
                  {job.responsibilities.split(". ").filter(Boolean).map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{r.endsWith(".") ? r : r + "."}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="font-normal"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              {job.benefits.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-3">
                    Benefits & Perks
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.benefits.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1.5 text-sm text-accent-foreground bg-accent px-3 py-1.5 rounded-full"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Similar Positions
                </h2>
                <div className="space-y-3">
                  {similarJobs.map((j) => (
                    <JobCard
                      key={j.id}
                      job={j}
                      onApply={handleApply}
                      onSave={() => toast.info("Please login to save")}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job overview card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl shadow-card p-6 sticky top-20"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Job Overview
              </h3>
              <div className="space-y-4">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Gender Preference</p>
                <p className="text-sm font-medium text-foreground">
                  {job.gender !== "Any" ? `${job.gender} preferred` : "Open to all"}
                </p>
              </div>

              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Industry</p>
                <Badge variant="outline">{job.industry}</Badge>
              </div>

              <Button
                className="w-full mt-6"
                onClick={handleApply}
              >
                Apply Now
              </Button>

              <button
                onClick={() => toast.info("Report submitted")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-4 mx-auto transition-colors"
              >
                <Flag className="h-3 w-3" /> Report this job
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobDetail;
