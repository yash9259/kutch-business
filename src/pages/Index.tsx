import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Briefcase, Building2, ArrowRight, Compass, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/layout/Layout";
import JobCard from "@/components/jobs/JobCard";
import type { Job } from "@/lib/mockData";
import { listRecentApprovedJobs } from "@/lib/candidateDashboard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Seo from "@/components/seo/Seo";
import FaqSection from "@/components/seo/FaqSection";
import { CITY_LANDINGS, HOME_FAQS, SITE } from "@/lib/siteConfig";
import { faqJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/structuredData";

const formatCount = (value: number) => value.toLocaleString("en-IN");

const Index = () => {
  const navigate = useNavigate();
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
  const [approvedJobsCount, setApprovedJobsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState([
    { label: "Active Opportunities", value: "0", icon: Briefcase, color: "from-primary to-red-500", glow: "shadow-primary/10" },
    { label: "Partner Companies", value: "0", icon: Building2, color: "from-orange-500 to-amber-500", glow: "shadow-orange-500/10" },
  ]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  useEffect(() => {
    const loadHomepageData = async () => {
      try {
        const [recentJobs, { count: candidateCount }, { count: approvedJobsTotal }, { data: companyRows }] = await Promise.all([
          listRecentApprovedJobs(4),
          supabase.from("candidate_profiles").select("user_id", { count: "exact", head: true }),
          supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("job_posts").select("company_name").eq("status", "approved"),
        ]);

        setApprovedJobs(recentJobs);
        setApprovedJobsCount(approvedJobsTotal || 0);
        const uniqueCompanies = new Set((companyRows || []).map((row) => row.company_name).filter(Boolean));

        setStats([
          { label: "Active Opportunities", value: formatCount(approvedJobsTotal || 0), icon: Briefcase, color: "from-primary to-red-500", glow: "shadow-primary/10" },
          { label: "Partner Companies", value: formatCount(uniqueCompanies.size), icon: Building2, color: "from-orange-500 to-amber-500", glow: "shadow-orange-500/10" },
        ]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load homepage data");
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadHomepageData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/jobs?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/jobs");
    }
  };

  const handleQuickSearch = (keyword: string) => {
    navigate(`/jobs?keyword=${encodeURIComponent(keyword)}`);
  };

  const popularSearches = ["Technology", "Marketing", "Finance", "Human Resources", "Sales"];

  return (
    <Layout>
      <Seo
        title="Jobs in Kutch, Gujarat - Find Jobs in Bhuj, Gandhidham, Anjar & Mundra"
        description={SITE.description}
        path="/"
        jsonLd={[organizationJsonLd(), websiteJsonLd(), faqJsonLd(HOME_FAQS)]}
      />
      {/* Hero Section */}
      <section className="relative border-b border-border/80 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-24 sm:py-36">
        {/* Glow ambient orbs with dynamic animations */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#8080800b_1.5px,transparent_1.5px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8"
          >
            {/* Tagline */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider shadow-sm animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Connecting Devotion & Career Excellence</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-foreground leading-tight tracking-tighter">
              <span className="sr-only">Jobs in Kutch, Gujarat: </span>
              <span className="font-light text-foreground/80 block sm:inline">Find your path.</span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-red-500 to-primary">
                Serve with purpose.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              Kutch Business connects job seekers with trusted employers across Kutch, Gujarat. Browse jobs in Bhuj,
              Gandhidham, Anjar and Mundra, register your candidate profile, or post openings for your organization.
            </p>

            {/* Double-Layered Glassmorphic Search Bar */}
            <div className="space-y-4 max-w-xl mx-auto pt-2">
              <form 
                onSubmit={handleSearchSubmit}
                className="bg-card/75 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-2 rounded-2xl flex flex-col sm:flex-row gap-2 relative overflow-hidden group"
              >
                {/* Subtle sweeping light overlay on search container */}
                <div className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-out pointer-events-none" />
                
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by position, category, keyword..." 
                    className="pl-10 h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground font-semibold placeholder:text-muted-foreground/80" 
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 w-full sm:w-auto px-6 font-semibold shadow-sm active:scale-95 transition-all">
                  Search Jobs
                </Button>
              </form>

              {/* Popular Searches Quick-Link Strip */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-muted-foreground font-semibold">Popular:</span>
                {popularSearches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleQuickSearch(s)}
                    className="inline-flex items-center rounded-lg bg-surface border border-border/80 px-2.5 py-1 font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats Cards Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className={`bg-card border border-border/80 rounded-2xl shadow-card p-6 text-center hover:shadow-card-hover hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}
              >
                {/* Soft gradient bottom glowing line */}
                <div className={`absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r ${s.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                
                {/* Light leak inside card */}
                <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface mx-auto mb-4 border border-border/60 shadow-sm group-hover:scale-110 transition-transform">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">
                  {s.value}
                </p>
                <p className="text-sm font-bold text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <section className="container py-20 sm:py-28">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Recent Opportunities
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1 text-xs font-semibold text-green-600 shadow-sm animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Live: {isLoadingJobs ? "..." : approvedJobsCount}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Discover the latest job opportunities published on the platform.</p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group shrink-0"
          >
            <span>Browse all jobs</span>
            <Star className="h-4 w-4 transform group-hover:rotate-45 transition-transform text-primary shrink-0" />
          </Link>
        </div>

        <div className="space-y-4">
          {isLoadingJobs ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
          ) : approvedJobs.length === 0 ? (
            <div className="rounded-2xl border border-border/80 bg-surface p-16 text-center text-muted-foreground shadow-sm">
              <Compass className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="font-bold text-foreground">No opportunities live right now</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">New job opportunities will appear here as soon as they are submitted by employers.</p>
            </div>
          ) : (
            approvedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={() => navigate("/login")}
                onSave={() => toast.info("Please login to save jobs")}
              />
            ))
          )}
        </div>
      </section>

      {/* Dynamic CTA Cards Section */}
      <section className="bg-surface border-t border-border/80 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] pointer-events-none" />

        <div className="container">
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Candidate CTA Card */}
            <div className="bg-card border border-border/85 rounded-2xl shadow-card p-8 sm:p-10 relative overflow-hidden group hover:shadow-card-hover hover:border-primary/20 transition-all duration-300">
              <div className="absolute top-0 right-0 h-28 w-28 bg-primary/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4 group-hover:bg-primary/10 transition-colors pointer-events-none" />
              <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span>Looking for a job?</span>
              </h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                Build your professional candidate profile, upload your resume, and start applying instantly to positions aligned with your skills and ideals.
              </p>
              <Link to="/register" className="inline-block">
                <Button className="px-6 font-semibold shadow-sm hover:translate-y-[-1px] transition-all duration-200">
                  Register Candidate Profile
                </Button>
              </Link>
            </div>

            {/* Employer CTA Card */}
            <div className="bg-card border border-border/85 rounded-2xl shadow-card p-8 sm:p-10 relative overflow-hidden group hover:shadow-card-hover hover:border-primary/20 transition-all duration-300">
              <div className="absolute top-0 right-0 h-28 w-28 bg-orange-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4 group-hover:bg-orange-500/10 transition-colors pointer-events-none" />
              <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <span>Hiring for your organization?</span>
              </h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">
                Submit a job posting in less than 2 minutes. No mandatory account setup required. Our moderation team reviews and publishes listings quickly.
              </p>
              <Link to="/post-job" className="inline-block">
                <Button variant="outline" className="px-6 font-semibold border-border hover:bg-surface transition-all duration-200">
                  Post a Job Listing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12" aria-labelledby="jobs-by-city-heading">
        <h2 id="jobs-by-city-heading" className="text-2xl font-bold text-foreground mb-2">Jobs in Kutch by city</h2>
        <p className="text-sm text-muted-foreground mb-5">Explore openings near you across Kutch, Gujarat.</p>
        <div className="flex flex-wrap gap-2">
          {CITY_LANDINGS.map((city) => (
            <Link
              key={city.slug}
              to={`/jobs-in/${city.slug}`}
              className="inline-flex items-center rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              Jobs in {city.name}
            </Link>
          ))}
        </div>
      </section>

      <FaqSection faqs={HOME_FAQS} />
    </Layout>
  );
};

export default Index;
