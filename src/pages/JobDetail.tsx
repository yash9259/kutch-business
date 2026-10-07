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
  Calendar, Bookmark, Share2, Flag, Building2, CheckCircle2, Phone, Sparkles, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import JobCard from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import { checkCandidatePaymentVerified } from "@/lib/candidateDashboard";
import { useJobApprovalConfig } from "@/hooks/use-job-approval-config";
import Seo from "@/components/seo/Seo";
import { jobPostingJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";

const JobDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnabled: isPaymentEnabled } = usePaymentSystem();
  const { required: isApprovalRequired } = useJobApprovalConfig();
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
        <div className="container py-12 space-y-6">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[280px] rounded-2xl" />
              <Skeleton className="h-[350px] rounded-2xl" />
            </div>
            <div>
              <Skeleton className="h-[450px] rounded-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <Seo title="Job not found" description="This job listing is no longer available." noindex />
        <div className="container py-24 text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Opportunity not found</h1>
          <p className="text-sm text-muted-foreground mb-6 font-semibold">This listing may have been filled, paused, or deleted by the moderator.</p>
          <Link to="/jobs">
            <Button className="w-full font-bold h-11 rounded-xl shadow-sm">Back to Job Listings</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const postedDays = Math.floor(
    (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const infoItems = [
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Briefcase, label: "Experience Required", value: job.experience },
    { icon: Clock, label: "Job Timing", value: job.jobTime },
    { icon: Users, label: "Total Openings", value: `${job.vacancy} position${job.vacancy !== 1 ? "s" : ""}` },
    { icon: GraduationCap, label: "Minimum Qualification", value: job.qualification },
    { icon: Calendar, label: "Posted On", value: postedDays === 0 ? "Today" : `${postedDays} day${postedDays !== 1 ? "s" : ""} ago` },
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
      <Seo
        title={`${job.position} at ${job.companyName} - ${job.location}`}
        description={`${job.companyName} is hiring a ${job.position} in ${job.location}. Salary: ${job.salaryRange}. Experience: ${job.experience}. Vacancies: ${job.vacancy}. Apply on Kutch Business.`}
        path={`/jobs/${job.id}`}
        type="article"
        jsonLd={[
          jobPostingJsonLd(job),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Jobs", path: "/jobs" },
            { name: job.position, path: `/jobs/${job.id}` },
          ]),
        ]}
      />
      {/* Sub-header navigation */}
      <div className="bg-surface border-b border-border/80">
        <div className="container py-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" /> 
            <span>Back to Job Listings</span>
          </Link>
        </div>
      </div>

      <div className="container py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Elegant Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/85 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden relative group"
            >
              {/* Left gradient accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-primary via-red-500 to-primary pointer-events-none" />
              
              {/* Corner soft light leak */}
              <div className="absolute -top-16 -right-16 h-36 w-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface border border-border/70 shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                      {job.position}
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground">
                      {job.companyName} · {job.location} · {job.industry}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xl font-black text-primary tabular-nums tracking-tighter">
                        {job.salaryRange}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">/ year</span>
                    </div>
                  </div>
                </div>

                {/* Styled action panel */}
                <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-border/60">
                  <Button
                    size="lg"
                    onClick={handleApply}
                    className="font-bold px-6 shadow-sm active:scale-95 transition-all h-12 rounded-xl relative overflow-hidden group/btn"
                  >
                    {/* Shine effect on button hover */}
                    <div className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-out pointer-events-none" />
                    <span>Apply for Job</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toast.info("Please login to save")}
                    className="gap-2 font-bold border-border bg-card shadow-sm hover:bg-surface active:scale-95 transition-all h-12 rounded-xl"
                  >
                    <Bookmark className="h-4.5 w-4.5" /> 
                    <span>Save Job</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Job details link copied to clipboard!");
                    }}
                    className="gap-2 font-bold hover:bg-surface active:scale-95 transition-all text-muted-foreground hover:text-foreground h-12 rounded-xl ml-auto sm:ml-0"
                  >
                    <Share2 className="h-4.5 w-4.5" /> 
                    <span>Share Opportunity</span>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Rich job specifications details container */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border/85 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 sm:p-8 space-y-8"
            >
              {/* About the Role */}
              <div className="space-y-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2 tracking-tight">
                  <Sparkles className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span>About the Role</span>
                </h2>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Key Responsibilities
                </h2>
                <ul className="grid grid-cols-1 gap-3">
                  {job.responsibilities.split(". ").filter(Boolean).map((r, i) => (
                    <li key={i} className="flex items-start gap-3.5 text-sm font-medium text-muted-foreground bg-surface p-4 rounded-xl border border-border/50 shadow-sm hover:border-primary/10 transition-colors">
                      <CheckCircle2 className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
                      <span>{r.endsWith(".") ? r : r + "."}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Skills */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Required Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {job.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="font-bold text-xs px-3.5 py-2 rounded-xl border border-border/60 bg-surface text-foreground shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all cursor-default"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Employer Contact Details Box */}
              {!isApprovalRequired && (
                <div className="pt-6 border-t border-border/60 space-y-4">
                  <h2 className="text-base font-bold text-foreground tracking-tight">
                    Employer Contact Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company info */}
                    <div className="flex items-center gap-3.5 bg-surface p-4 rounded-xl border border-border/80 hover:border-primary/20 hover:bg-primary/[0.01] transition-all group/contact shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/60 shrink-0 shadow-sm">
                        <Building2 className="h-5 w-5 text-primary group-hover/contact:scale-105 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground">Company Name</p>
                        <p className="text-sm font-bold text-foreground truncate">{job.companyName}</p>
                      </div>
                    </div>
                    
                    {/* Contact name */}
                    {job.interviewContactName && (
                      <div className="flex items-center gap-3.5 bg-surface p-4 rounded-xl border border-border/80 hover:border-primary/20 hover:bg-primary/[0.01] transition-all group/contact shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/60 shrink-0 shadow-sm">
                          <Users className="h-5 w-5 text-primary group-hover/contact:scale-105 transition-transform" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground">Contact Person</p>
                          <p className="text-sm font-bold text-foreground truncate">{job.interviewContactName}</p>
                        </div>
                      </div>
                    )}

                    {/* Phone number */}
                    {job.interviewContact && (
                      <div className="flex items-center gap-3.5 bg-surface p-4 rounded-xl border border-border/80 hover:border-primary/20 hover:bg-primary/[0.01] transition-all group/contact shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/60 shrink-0 shadow-sm">
                          <Phone className="h-5 w-5 text-primary group-hover/contact:scale-105 transition-transform" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground">Contact Number</p>
                          <p className="text-sm font-extrabold text-primary font-mono">
                            <a href={`tel:${job.interviewContact}`} className="hover:underline">
                              {job.interviewContact}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {job.companyEmail && (
                      <div className="flex items-center gap-3.5 bg-surface p-4 rounded-xl border border-border/80 hover:border-primary/20 hover:bg-primary/[0.01] transition-all group/contact shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/60 shrink-0 shadow-sm">
                          <Building2 className="h-5 w-5 text-primary group-hover/contact:scale-105 transition-transform" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground">Company Email</p>
                          <p className="text-sm font-extrabold text-primary font-mono truncate">
                            <a href={`mailto:${job.companyEmail}`} className="hover:underline">
                              {job.companyEmail}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits & Perks */}
              {job.benefits.length > 0 && (
                <div className="pt-6 border-t border-border/60 space-y-4">
                  <h2 className="text-base font-bold text-foreground tracking-tight">
                    Benefits & Perks
                  </h2>
                  <div className="flex flex-wrap gap-2.5">
                    {job.benefits.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-foreground bg-accent/80 border border-accent-foreground/10 px-3.5 py-2.5 rounded-xl shadow-sm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{b}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Similar Positions */}
            {similarJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-black text-foreground tracking-tight">
                  Similar Devotee Openings
                </h2>
                <div className="grid grid-cols-1 gap-4">
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

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Sticky Job Overview card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border/85 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 sticky top-20 space-y-6 group"
            >
              {/* Corner soft light leak inside sidebar */}
              <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <h3 className="text-sm font-bold text-foreground tracking-tight border-b border-border/60 pb-3 mb-1">
                Job Overview Specifications
              </h3>
              
              <div className="space-y-4 relative z-10">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3.5 pb-3 border-b border-border/40 last:border-b-0 last:pb-0 group/item">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/70 shrink-0 group-hover/item:scale-105 transition-transform duration-200 shadow-sm">
                      <item.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between relative z-10">
                <span className="text-xs text-muted-foreground font-bold">Gender Preference</span>
                <span className="text-xs font-bold text-foreground bg-surface border border-border/60 px-3 py-1 rounded-lg shadow-sm">
                  {job.gender !== "Any" ? `${job.gender}` : "Open to All"}
                </span>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between relative z-10">
                <span className="text-xs text-muted-foreground font-bold">Industry Sector</span>
                <Badge variant="outline" className="font-bold border-primary/20 bg-primary/5 text-primary rounded-lg text-xs px-2.5 py-0.5 shadow-sm">
                  {job.industry}
                </Badge>
              </div>

              <Button
                className="w-full font-bold shadow-sm h-11 active:scale-95 transition-all rounded-xl mt-4 relative overflow-hidden group/btn"
                onClick={handleApply}
              >
                <div className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-out pointer-events-none" />
                <span>Apply for Job</span>
              </Button>

              <button
                onClick={() => toast.success("Flag submitted successfully. Thank you for keeping the community safe!")}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground mt-4 mx-auto transition-colors active:scale-95"
              >
                <Flag className="h-3.5 w-3.5" /> 
                <span>Report this listing</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobDetail;
